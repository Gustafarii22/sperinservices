package uk.co.sperinservices.certificates;

import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import androidx.test.core.app.ActivityScenario;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;
import org.json.JSONArray;
import org.json.JSONObject;
import org.junit.Test;
import org.junit.runner.RunWith;
import java.io.InputStream;
import java.lang.reflect.Field;
import java.lang.reflect.Method;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;
import static org.junit.Assert.*;

@RunWith(AndroidJUnit4.class)
public class ConsumerUnitOcrTest {
    @Test
    public void realConsumerUnitPhotoReachesNativeMlKitAndWebviewWithPositions() throws Exception {
        InputStream in=InstrumentationRegistry.getInstrumentation().getContext().getAssets().open("consumer-unit-qa.webp");
        Bitmap bitmap=BitmapFactory.decodeStream(in);
        in.close();
        assertNotNull("The real consumer-unit photo was not bundled into QA",bitmap);
        final CountDownLatch loaded=new CountDownLatch(1);
        try(ActivityScenario<MainActivity> scenario=ActivityScenario.launch(MainActivity.class)){
            Field field=MainActivity.class.getDeclaredField("webView");
            field.setAccessible(true);
            scenario.onActivity(activity->{
                try {
                    WebView webView=(WebView)field.get(activity);
                    webView.setWebViewClient(new WebViewClient(){
                        @Override public void onPageFinished(WebView view,String url){loaded.countDown();}
                    });
                    webView.loadDataWithBaseURL("https://sperinservices.co.uk/",
                        "<html><script>window.SperinConsumerScan={ocrResult:function(t,j,e){window.__scanTest={token:t,json:JSON.parse(j||'{}'),error:e}}};</script></html>",
                        "text/html","UTF-8",null);
                }catch(Exception ex){throw new IllegalStateException(ex);}
            });
            assertTrue("Webview OCR callback page did not load",loaded.await(20,TimeUnit.SECONDS));
            Method scan=MainActivity.class.getDeclaredMethod("scanConsumerBoardBitmap",String.class,Bitmap.class);
            scan.setAccessible(true);
            scenario.onActivity(activity->{
                try { scan.invoke(activity,"board-ocr-native-qa",bitmap); }
                catch(Exception ex){throw new IllegalStateException(ex);}
            });
            JSONObject payload=null;
            long end=System.currentTimeMillis()+90000L;
            while(System.currentTimeMillis()<end){
                CountDownLatch done=new CountDownLatch(1);
                AtomicReference<String> received=new AtomicReference<>();
                scenario.onActivity(activity->{
                    try {
                        WebView webView=(WebView)field.get(activity);
                        webView.evaluateJavascript("JSON.stringify(window.__scanTest||null)",v->{
                            received.set(v);
                            done.countDown();
                        });
                    }catch(Exception ex){done.countDown();}
                });
                done.await(5,TimeUnit.SECONDS);
                String result=received.get();
                if(result!=null&&!"null".equals(result)){
                    String decoded=new JSONArray("["+result+"]").getString(0);
                    if(!"null".equals(decoded)){
                        payload=new JSONObject(decoded);
                        break;
                    }
                }
                Thread.sleep(750);
            }
            assertNotNull("The real ML Kit recognition never returned to the app",payload);
            assertEquals("board-ocr-native-qa",payload.getString("token"));
            assertEquals("OCR returned an error", "",payload.optString("error"));
            JSONObject data=payload.getJSONObject("json");
            JSONArray lines=data.getJSONArray("lines");
            assertTrue("No useful positioned text was recognised on a real consumer-unit photograph",lines.length()>=3);
            boolean foundPosition=false;
            for(int i=0;i<lines.length();i++){
                JSONObject row=lines.getJSONObject(i);
                if(row.has("left")&&row.has("top")&&row.has("right")&&row.has("bottom")){
                    assertTrue("OCR coordinates outside image",row.getInt("left")>=0&&row.getInt("right")<=data.getInt("width")+2);
                    foundPosition=true;
                }
            }
            assertTrue("Native OCR lost device coordinates",foundPosition);
        }
    }
}
