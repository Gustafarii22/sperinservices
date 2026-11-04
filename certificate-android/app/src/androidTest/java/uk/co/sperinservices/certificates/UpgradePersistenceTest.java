package uk.co.sperinservices.certificates;

import android.webkit.WebView;
import androidx.test.core.app.ActivityScenario;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;
import org.junit.Test;
import org.junit.runner.RunWith;
import java.lang.reflect.Field;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;
import static org.junit.Assert.*;

/** Synthetic emulator data only. Never run against a user's installation. */
@RunWith(AndroidJUnit4.class)
public class UpgradePersistenceTest {
    private String js(ActivityScenario<MainActivity> scenario, String script) throws Exception {
        AtomicReference<String> result = new AtomicReference<>();
        CountDownLatch done = new CountDownLatch(1);
        scenario.onActivity(activity -> {
            try {
                Field field = MainActivity.class.getDeclaredField("webView");field.setAccessible(true);
                ((WebView)field.get(activity)).evaluateJavascript(script,value -> {result.set(value);done.countDown();});
            } catch(Exception e) {throw new RuntimeException(e);}
        });
        assertTrue("WebView evaluation timed out",done.await(15,TimeUnit.SECONDS));return result.get();
    }
    @Test public void preservesSyntheticCertificatesAcrossUpgrade() throws Exception {
        String stage=InstrumentationRegistry.getArguments().getString("upgradeStage", "skip");
        if(stage.equals("skip"))return;
        try(ActivityScenario<MainActivity> scenario=ActivityScenario.launch(MainActivity.class)) {
            boolean ready=false;
            for(int i=0;i<60;i++) {
                if("true".equals(js(scenario,"typeof window.sperinRestoreBackup==='function'"))){ready=true;break;}
                Thread.sleep(500);
            }
            assertTrue("Bundled app failed to load",ready);
            if(stage.equals("seed")) {
                js(scenario,"(()=>{const types=['eic','eicr','minor','emergency','smoke','pat','ev','solar','commercialFire'];const certificates=types.map(type=>({id:'upgrade-'+type,type,number:'UPGRADE-'+type,status:'Draft',fields:{clientName:'Upgrade preservation check',testerSerial:'UPGRADE-MFT'},tables:{circuits:[{id:'c-'+type,boardRef:'DB1',circuitNo:'1',description:'Upgrade circuit'}],tests:[{boardRef:'DB1',circuitNo:'1',zs:'0.43',r1r2:'0.21',r2only:'0.18'}]}}));window.sperinRestoreBackup(JSON.stringify({certificates,jobs:[],backupSchema:2,jobPhotos:{}})).then(()=>window.__upgradeSeedDone=true);return true;})()");
                boolean seeded=false;
                for(int i=0;i<60;i++) {if("true".equals(js(scenario,"window.__upgradeSeedDone===true"))){seeded=true;break;}Thread.sleep(500);}
                assertTrue("Seed import did not complete",seeded);
            }
            assertEquals("true",js(scenario,"(()=>{const c=JSON.parse(localStorage.getItem('sperin-certificates-data-v1')).certificates;return c.length===9&&c.every(x=>x.fields.clientName==='Upgrade preservation check'&&x.fields.testerSerial==='UPGRADE-MFT'&&x.tables.tests[0].zs==='0.43'&&x.tables.tests[0].r1r2==='0.21'&&x.tables.tests[0].r2only==='0.18');})()"));
        }
    }
}
