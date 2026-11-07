package uk.co.sperinservices.certificates;

import android.app.Activity;
import android.content.pm.ActivityInfo;
import android.os.Build;
import android.util.Log;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.RejectedExecutionException;
import java.util.concurrent.atomic.AtomicInteger;
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
    private final ExecutorService pdfRenderWorker = Executors.newSingleThreadExecutor();
    private final AtomicInteger renderRequest = new AtomicInteger();
    private volatile boolean closing = false;
    private int pageCount = 0;

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
            pageCount = renderer.getPageCount();
            if(pageCount<=0) throw new IllegalStateException("PDF is empty");
            try(PdfRenderer.Page first=renderer.openPage(0)) {
                documentLandscape=first.getWidth()>first.getHeight();
            }
            // Do not force an orientation change inside onCreate. On Samsung
            // this can recreate the Activity while it is opening its PDF and
            // appear as a flicker, bounce or never-opening preview. ImageView
            // FIT_CENTER displays all A4 pages correctly in either orientation.
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
        if(closing || renderer==null || pageImage==null ||
           pageImage.getWidth()<=0 || pageImage.getHeight()<=0) return;
        final int requestedPage=Math.max(0,Math.min(pageCount-1,requested));
        index=requestedPage;
        final int viewWidth=pageImage.getWidth();
        final int viewHeight=pageImage.getHeight();
        final int request=renderRequest.incrementAndGet();
        // Show navigation state immediately; decoding never blocks the UI.
        counter.setText("Loading page "+(requestedPage+1)+" of "+pageCount);
        previous.setEnabled(requestedPage>0);
        next.setEnabled(requestedPage<pageCount-1);
        try {
            pdfRenderWorker.execute(() -> {
                Bitmap bitmap=null;
                try(PdfRenderer.Page page=renderer.openPage(requestedPage)) {
                    // Render at most 2200px on the long edge, on a dedicated
                    // worker thread. Large EICRs must not block the UI or
                    // allocate multiple full-resolution bitmaps during resize.
                    float fit=Math.min(viewWidth/(float)page.getWidth(),
                        viewHeight/(float)page.getHeight());
                    float scale=Math.max(1f,Math.min(2.5f,fit*1.7f));
                    scale=Math.min(scale,2200f/Math.max(page.getWidth(),page.getHeight()));
                    int width=Math.max(1,Math.round(page.getWidth()*scale));
                    int height=Math.max(1,Math.round(page.getHeight()*scale));
                    bitmap=Bitmap.createBitmap(width,height,Bitmap.Config.ARGB_8888);
                    bitmap.eraseColor(Color.WHITE);
                    page.render(bitmap,null,null,PdfRenderer.Page.RENDER_MODE_FOR_DISPLAY);
                    final Bitmap ready=bitmap;
                    runOnUiThread(() -> {
                        if(closing || renderRequest.get()!=request || pageImage==null) {
                            ready.recycle();
                            return;
                        }
                        Bitmap old=displayed;
                        pageImage.setImageBitmap(ready);
                        displayed=ready;
                        if(old!=null && old!=ready && !old.isRecycled())old.recycle();
                        resetZoom();
                        counter.setText("Page "+(requestedPage+1)+" of "+pageCount);
                    });
                }catch(Exception error) {
                    if(bitmap!=null && !bitmap.isRecycled())bitmap.recycle();
                    Log.e("SperinPdfPreview","Could not render page "+(requestedPage+1),error);
                    runOnUiThread(() -> {
                        if(closing || renderRequest.get()!=request) return;
                        counter.setText("PDF page unavailable");
                        new android.app.AlertDialog.Builder(this)
                            .setTitle("PDF page unavailable")
                            .setMessage("Page "+(requestedPage+1)+": "+error.getMessage())
                            .setPositiveButton("Close",(dialog,which)->finish())
                            .show();
                    });
                }
            });
        } catch(RejectedExecutionException ignored) {
            // The user has closed the preview while a queued render was pending.
        }
    }

    @Override protected void onSaveInstanceState(Bundle state) {
        state.putInt("page",index);
        super.onSaveInstanceState(state);
    }

    @Override protected void onDestroy() {
        closing=true;
        renderRequest.incrementAndGet();
        if(pageImage!=null)pageImage.setImageDrawable(null);
        if(displayed!=null&&!displayed.isRecycled())displayed.recycle();
        displayed=null;
        // PdfRenderer must never be closed on the UI thread while a background
        // render is using it. Enqueue closure after the last render request.
        try {
            pdfRenderWorker.execute(() -> {
                if(renderer!=null)try{renderer.close();}catch(Exception e){Log.w("SperinPdfPreview","Close renderer",e);}
                if(descriptor!=null)try{descriptor.close();}catch(Exception e){Log.w("SperinPdfPreview","Close descriptor",e);}
            });
        }catch(RejectedExecutionException e){
            if(renderer!=null)try{renderer.close();}catch(Exception ignored){}
            if(descriptor!=null)try{descriptor.close();}catch(Exception ignored){}
        }
        pdfRenderWorker.shutdown();
        super.onDestroy();
    }
}
