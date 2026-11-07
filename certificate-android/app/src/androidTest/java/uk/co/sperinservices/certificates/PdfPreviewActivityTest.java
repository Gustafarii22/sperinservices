package uk.co.sperinservices.certificates;

import android.content.Context;
import android.content.Intent;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.pdf.PdfDocument;
import android.net.Uri;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.ImageView;
import android.widget.TextView;
import androidx.core.content.FileProvider;
import androidx.test.core.app.ActivityScenario;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;
import org.junit.Test;
import org.junit.runner.RunWith;
import static org.junit.Assert.*;
import java.io.File;
import java.io.FileOutputStream;

/** A synthetic six-page PDF exercises the built-in fit-page reader on Android. */
@RunWith(AndroidJUnit4.class)
public class PdfPreviewActivityTest {
    private static TextView findLabel(View view,String text){
        if(view instanceof TextView && text.contentEquals(((TextView)view).getText())) return (TextView)view;
        if(view instanceof ViewGroup){
            ViewGroup group=(ViewGroup)view;
            for(int i=0;i<group.getChildCount();i++){
                TextView found=findLabel(group.getChildAt(i),text);
                if(found!=null)return found;
            }
        }
        return null;
    }
    private static ImageView findImage(View view){
        if(view instanceof ImageView)return (ImageView)view;
        if(view instanceof ViewGroup){
            ViewGroup group=(ViewGroup)view;
            for(int i=0;i<group.getChildCount();i++){
                ImageView found=findImage(group.getChildAt(i));
                if(found!=null)return found;
            }
        }
        return null;
    }
    @Test public void opensLandscapePdfAsOneFittedPageWithNavigation() throws Exception{
        Context context=InstrumentationRegistry.getInstrumentation().getTargetContext();
        File file=new File(context.getCacheDir(),"qa-six-page-certificate.pdf");
        PdfDocument pdf=new PdfDocument();
        try {
            for(int i=1;i<=6;i++){
                PdfDocument.PageInfo pageInfo=new PdfDocument.PageInfo.Builder(1122,794,i).create();
                PdfDocument.Page page=pdf.startPage(pageInfo);
                Canvas canvas=page.getCanvas();
                canvas.drawColor(Color.WHITE);
                Paint paint=new Paint();paint.setColor(Color.BLACK);paint.setTextSize(32);
                canvas.drawText("Certificate page "+i,40,55,paint);
                pdf.finishPage(page);
            }
            try(FileOutputStream out=new FileOutputStream(file)){pdf.writeTo(out);}
        }finally{pdf.close();}
        Uri uri=FileProvider.getUriForFile(context,context.getPackageName()+".fileprovider",file);
        Intent intent=new Intent(context,PdfPreviewActivity.class);
        intent.setDataAndType(uri,"application/pdf");
        intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
        try(ActivityScenario<PdfPreviewActivity> scenario=ActivityScenario.launch(intent)){
            boolean opened=false;
            for(int i=0;i<25;i++){
                final boolean[] result={false};
                scenario.onActivity(activity->{
                    View root=activity.getWindow().getDecorView();
                    ImageView image=findImage(root);
                    result[0]=findLabel(root,"Page 1 of 6")!=null &&
                        image!=null && image.getDrawable()!=null &&
                        image.getScaleType()==ImageView.ScaleType.FIT_CENTER;
                });
                if(result[0]){opened=true;break;}
                Thread.sleep(200);
            }
            assertTrue("PDF reader did not show a fully fitted first page",opened);
            scenario.onActivity(activity->{
                // The preview must not demand a Samsung screen rotation: the
                // forced orientation in v211 recreated the activity on open.
                assertEquals(android.content.pm.ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED,
                    activity.getRequestedOrientation());
                Button next=(Button)findLabel(activity.getWindow().getDecorView(),"›");
                assertNotNull("Next-page control missing",next);
                next.performClick();
            });
            boolean secondReady=false;
            for(int i=0;i<40;i++){
                final boolean[] ready={false};
                scenario.onActivity(activity->{
                    View root=activity.getWindow().getDecorView();
                    ready[0]=findLabel(root,"Page 2 of 6")!=null &&
                        findImage(root)!=null && findImage(root).getDrawable()!=null;
                });
                if(ready[0]){secondReady=true;break;}
                Thread.sleep(200);
            }
            assertTrue("Background PDF page 2 did not finish rendering",secondReady);
            scenario.onActivity(activity->{
                Button fit=(Button)findLabel(activity.getWindow().getDecorView(),"Fit");
                assertNotNull(fit);
                fit.performClick();
                ImageView image=findImage(activity.getWindow().getDecorView());
                assertEquals(1f,image.getScaleX(),0.01f);
                // Rapid navigation should not crash or display a stale frame.
                Button next=(Button)findLabel(activity.getWindow().getDecorView(),"›");
                next.performClick();
                next.performClick();
            });
            boolean fourthReady=false;
            for(int i=0;i<40;i++){
                final boolean[] ready={false};
                scenario.onActivity(activity->
                    ready[0]=findLabel(activity.getWindow().getDecorView(),"Page 4 of 6")!=null);
                if(ready[0]){fourthReady=true;break;}
                Thread.sleep(200);
            }
            assertTrue("Rapid navigation displayed a stale or missing page",fourthReady);
        }finally{file.delete();}
    }
}
