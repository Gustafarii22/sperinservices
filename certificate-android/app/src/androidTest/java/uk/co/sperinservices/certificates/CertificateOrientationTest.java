package uk.co.sperinservices.certificates;

import android.content.pm.ActivityInfo;
import android.view.View;
import android.view.WindowManager;
import android.webkit.WebView;
import androidx.test.core.app.ActivityScenario;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import org.junit.Test;
import org.junit.runner.RunWith;
import java.lang.reflect.Field;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;
import static org.junit.Assert.*;

/** Runs only on synthetic emulator installations, after upgrade preservation checks. */
@RunWith(AndroidJUnit4.class)
public class CertificateOrientationTest {
    private String js(ActivityScenario<MainActivity> scenario,String code) throws Exception {
        CountDownLatch latch=new CountDownLatch(1);
        AtomicReference<String> result=new AtomicReference<>();
        scenario.onActivity(activity->{try{
            Field field=MainActivity.class.getDeclaredField("webView");field.setAccessible(true);
            ((WebView)field.get(activity)).evaluateJavascript(code,value->{result.set(value);latch.countDown();});
        }catch(Exception ex){throw new RuntimeException(ex);}});
        assertTrue(latch.await(15,TimeUnit.SECONDS));return result.get();
    }
    private void waitFor(ActivityScenario<MainActivity> scenario,String code) throws Exception {
        for(int i=0;i<80;i++){if("true".equals(js(scenario,code)))return;Thread.sleep(250);}
        fail("Timed out: "+code);
    }
    @Test public void certificateOnlyLandscapeAndActualPdfStayInsideSystemBars() throws Exception {
        try(ActivityScenario<MainActivity> scenario=ActivityScenario.launch(MainActivity.class)){
            waitFor(scenario,"!!document.querySelector('[data-action=\"open-new\"]')");
            js(scenario,"document.querySelector('[data-action=\"open-new\"]').click()");
            js(scenario,"document.querySelector('[data-action=\"new\"][data-type=\"eic\"]').click()");
            js(scenario,"document.querySelector('[data-action=\"choose-entry\"][data-mode=\"certificate\"]').click()");
            waitFor(scenario,"!!document.querySelector('.cv-pdf-canvas[data-ready=\"true\"]')");
            scenario.onActivity(activity->{
                assertEquals(ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE,activity.getRequestedOrientation());
                assertEquals(0,activity.getWindow().getAttributes().flags&WindowManager.LayoutParams.FLAG_FULLSCREEN);
                View content=activity.findViewById(android.R.id.content);
                View safe=((android.view.ViewGroup)content).getChildAt(0);
                assertTrue("Status bar inset must be reserved",safe.getPaddingTop()>0);
            });
            js(scenario,"document.querySelector('[data-action=\"open-library\"]').click()");
            waitFor(scenario,"document.body.dataset.page==='library'");
            // Bridge applies orientation on the UI thread.
            Thread.sleep(300);
            scenario.onActivity(activity->assertEquals(ActivityInfo.SCREEN_ORIENTATION_FULL_USER,activity.getRequestedOrientation()));
        }
    }
}
