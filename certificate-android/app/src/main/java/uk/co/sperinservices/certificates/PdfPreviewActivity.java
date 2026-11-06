package uk.co.sperinservices.certificates;

import android.app.Activity;
import android.content.pm.ActivityInfo;
import android.graphics.Bitmap;
import android.graphics.Color;
import android.graphics.pdf.PdfRenderer;
import android.os.Bundle;
import android.os.ParcelFileDescriptor;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.MotionEvent;
import android.view.ScaleGestureDetector;
import android.view.View;
import android.view.ViewGroup;
import android.view.WindowManager;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Button;

/**
 * On-device full-page PDF viewer. Does not depend on another reader's initial
 * zoom setting, network service, or external storage permission.
 * The original exported PDF remains in Downloads.
 */
public final class PdfPreviewActivity extends Activity {
    private ParcelFileDescriptor descriptor;
    private PdfRenderer renderer;
    private Bitmap displayed;
    private ImageView pageImage;
    private TextView counter;
    private Button previous;
    private Button next;
    private int index = 0;
    private boolean documentLandscape = false;
    private float zoom = 1f;
    private float moveX = 0f;
    private float moveY = 0f;
    private float downX, downY;
    private ScaleGestureDetector zoomGesture;

    private int dp(float value) {
        return Math.round(TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP,
            value, getResources().getDisplayMetrics()));
    }

    private Button control(String label) {
        Button b = new Button(this);
        b.setText(label);
        b.setTextColor(Color.WHITE);
        b.setAllCaps(false);
        b.setTextSize(15);
        b.setBackgroundTintList(android.content.res.ColorStateList.valueOf(Color.rgb(20,58,98)));
        b.setMinHeight(dp(46));
        b.setMinimumHeight(dp(46));
        return b;
    }

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        androidx.core.view.WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        getWindow().setNavigationBarColor(Color.rgb(7,17,31));
        if(savedInstanceState != null) index = Math.max(0, savedInstanceState.getInt("page",0));
        try {
            if(getIntent().getData()==null) throw new IllegalArgumentException("PDF address missing");
            descriptor = getContentResolver().openFileDescriptor(getIntent().getData(),"r");
            if(descriptor==null) throw new IllegalStateException("Could not open PDF");
            renderer = new PdfRenderer(descriptor);
            if(renderer.getPageCount()<=0) throw new IllegalStateException("PDF is empty");
            try(PdfRenderer.Page first=renderer.openPage(0)) {
                documentLandscape=first.getWidth()>first.getHeight();
                if(documentLandscape) {
                    if(getRequestedOrientation()!=ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE)
                        setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE);
                } else {
                    if(getRequestedOrientation()!=ActivityInfo.SCREEN_ORIENTATION_SENSOR_PORTRAIT)
                        setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_SENSOR_PORTRAIT);
                }
            }
        }catch(Exception error) {
            new android.app.AlertDialog.Builder(this)
                .setTitle("Could not open PDF")
                .setMessage(error.getMessage())
                .setPositiveButton("Close",(d,w)->finish())
                .show();
            return;
        }
        LinearLayout layout = new LinearLayout(this);
        layout.setOrientation(LinearLayout.VERTICAL);
        layout.setBackgroundColor(Color.rgb(222,230,240));

        LinearLayout nav = new LinearLayout(this);
        nav.setGravity(Gravity.CENTER_VERTICAL);
        nav.setPadding(dp(8),dp(3),dp(8),dp(3));
        nav.setBackgroundColor(Color.rgb(7,27,50));
        previous=control("‹");
        next=control("›");
        counter=new TextView(this);
        counter.setGravity(Gravity.CENTER);
        counter.setTextColor(Color.WHITE);
        counter.setTextSize(14);
        counter.setTypeface(null,android.graphics.Typeface.BOLD);
        Button fit=control("Fit");
        Button print=control("Print");
        Button close=control("✕");
        nav.addView(previous,new LinearLayout.LayoutParams(dp(50),dp(49)));
        nav.addView(counter,new LinearLayout.LayoutParams(0,dp(49),1));
        nav.addView(next,new LinearLayout.LayoutParams(dp(50),dp(49)));
        nav.addView(fit,new LinearLayout.LayoutParams(dp(60),dp(49)));
        nav.addView(print,new LinearLayout.LayoutParams(dp(70),dp(49)));
        nav.addView(close,new LinearLayout.LayoutParams(dp(50),dp(49)));
        layout.addView(nav,new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT,dp(55)));

        FrameLayout pane = new FrameLayout(this);
        pane.setBackgroundColor(Color.rgb(222,230,240));
        pane.setClipChildren(true);
        pageImage=new ImageView(this);
        pageImage.setScaleType(ImageView.ScaleType.FIT_CENTER);
        pageImage.setBackgroundColor(Color.TRANSPARENT);
        pane.addView(pageImage,new FrameLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,ViewGroup.LayoutParams.MATCH_PARENT));
        layout.addView(pane,new LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,0,1));
        setContentView(layout);
        androidx.core.view.ViewCompat.setOnApplyWindowInsetsListener(layout, (view, insets) -> {
            androidx.core.graphics.Insets safe = insets.getInsets(
                androidx.core.view.WindowInsetsCompat.Type.systemBars()
                | androidx.core.view.WindowInsetsCompat.Type.displayCutout());
            view.setPadding(safe.left, safe.top, safe.right, safe.bottom);
            return androidx.core.view.WindowInsetsCompat.CONSUMED;
        });
        androidx.core.view.ViewCompat.requestApplyInsets(layout);

        zoomGesture=new ScaleGestureDetector(this,
            new ScaleGestureDetector.SimpleOnScaleGestureListener(){
                @Override public boolean onScale(ScaleGestureDetector detector) {
                    zoom=Math.min(4f,Math.max(1f,zoom*detector.getScaleFactor()));
                    applyTransform();
                    return true;
                }
            });
        pageImage.setOnTouchListener((view,event)-> {
            zoomGesture.onTouchEvent(event);
            switch(event.getActionMasked()) {
                case MotionEvent.ACTION_DOWN:
                    downX=event.getX()-moveX;
                    downY=event.getY()-moveY;
                    return true;
                case MotionEvent.ACTION_MOVE:
                    if(event.getPointerCount()==1&&zoom>1.01f&&!zoomGesture.isInProgress()){
                        moveX=event.getX()-downX;
                        moveY=event.getY()-downY;
                        applyTransform();
                    }
                    return true;
                default:
                    return true;
            }
        });
        previous.setOnClickListener(v -> showPage(index-1));
        next.setOnClickListener(v -> showPage(index+1));
        fit.setOnClickListener(v -> resetZoom());
        print.setOnClickListener(v -> {
            try {
                CertificatePdfPrinter.print(this, getIntent().getData(), renderer.getPageCount(), documentLandscape);
            } catch (Exception error) {
                android.widget.Toast.makeText(this, "Could not print PDF: " + error.getMessage(),
                    android.widget.Toast.LENGTH_LONG).show();
            }
        });
        close.setOnClickListener(v -> finish());
        pane.addOnLayoutChangeListener((v,l,t,r,b,ol,ot,or_,ob) -> {
            if((r-l)!=(or_-ol)||(b-t)!=(ob-ot)) showPage(index);
        });
        pane.post(()->showPage(index));
    }

    private void resetZoom() {
        zoom=1f;moveX=0f;moveY=0f;
        applyTransform();
    }

    private void applyTransform() {
        if(pageImage==null) return;
        // The unscaled ImageView is always fitted to its parent, without cropping.
        pageImage.setScaleX(zoom);
        pageImage.setScaleY(zoom);
        float maxX=pageImage.getWidth()*Math.max(0f,zoom-1f)/2f;
        float maxY=pageImage.getHeight()*Math.max(0f,zoom-1f)/2f;
        moveX=Math.max(-maxX,Math.min(maxX,moveX));
        moveY=Math.max(-maxY,Math.min(maxY,moveY));
        pageImage.setTranslationX(moveX);
        pageImage.setTranslationY(moveY);
    }

    private void showPage(int requested) {
        if(renderer==null||pageImage==null||pageImage.getWidth()==0||pageImage.getHeight()==0)return;
        int total=renderer.getPageCount();
        index=Math.max(0,Math.min(total-1,requested));
        Bitmap nextBitmap=null;
        try(PdfRenderer.Page page=renderer.openPage(index)) {
            float fit=Math.min(pageImage.getWidth()/(float)page.getWidth(),
                pageImage.getHeight()/(float)page.getHeight());
            float density=Math.max(1f,Math.min(3f,fit*2f));
            int width=Math.max(1,Math.min(2600,Math.round(page.getWidth()*density)));
            int height=Math.max(1,Math.min(2600,Math.round(page.getHeight()*density)));
            nextBitmap=Bitmap.createBitmap(width,height,Bitmap.Config.ARGB_8888);
            nextBitmap.eraseColor(Color.WHITE);
            page.render(nextBitmap,null,null,PdfRenderer.Page.RENDER_MODE_FOR_DISPLAY);
            pageImage.setImageBitmap(nextBitmap);
            if(displayed!=null&&!displayed.isRecycled())displayed.recycle();
            displayed=nextBitmap;
            resetZoom();
            counter.setText("Page "+(index+1)+" of "+total);
            previous.setEnabled(index>0);
            next.setEnabled(index<total-1);
        }catch(Exception ex) {
            if(nextBitmap!=null&&!nextBitmap.isRecycled())nextBitmap.recycle();
            new android.app.AlertDialog.Builder(this).setTitle("PDF page unavailable")
                .setMessage(ex.getMessage()).setPositiveButton("Close",(d,w)->finish()).show();
        }
    }

    @Override protected void onSaveInstanceState(Bundle state) {
        state.putInt("page",index);
        super.onSaveInstanceState(state);
    }

    @Override protected void onDestroy() {
        if(pageImage!=null)pageImage.setImageDrawable(null);
        if(displayed!=null&&!displayed.isRecycled())displayed.recycle();
        if(renderer!=null)renderer.close();
        if(descriptor!=null)try{descriptor.close();}catch(Exception ignored){}
        super.onDestroy();
    }
}
