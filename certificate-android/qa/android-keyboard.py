"""Exercise native IME behaviour on the actual signed APK using accessibility nodes."""
import subprocess,re,time,xml.etree.ElementTree as ET,pathlib
out=pathlib.Path('certificate-android/qa-output/android')
def adb(*args):return subprocess.check_output(['adb',*args],text=True)
def nodes():
    adb('shell','uiautomator','dump','/sdcard/keyboard.xml')
    return list(ET.fromstring(adb('shell','cat','/sdcard/keyboard.xml')).iter('node'))
def find(label,cls=None,scroll=False):
    for _ in range(45 if scroll else 4):
        for n in nodes():
            if (n.get('text')==label or n.get('content-desc')==label) and (not cls or n.get('class')==cls):
                box=list(map(int,re.findall(r'\d+',n.get('bounds',''))))
                if len(box)==4 and box[3]>box[1] and box[2]>box[0]:return box
        if scroll:adb('shell','input','swipe','500','1500','500','500','180')
        time.sleep(.3)
    raise AssertionError('Visible control not found: '+label)
def tap(box):adb('shell','input','tap',str((box[0]+box[2])//2),str((box[1]+box[3])//2));time.sleep(.5)
def ime():
    state=adb('shell','dumpsys','input_method')
    (out/'input-method.txt').write_text(state)
    return bool(re.search(r'(?:mInputShown|isInputViewShown)=true',state))
adb('shell','settings','put','system','user_rotation','0')
adb('shell','settings','put','secure','show_ime_with_hard_keyboard','1')
time.sleep(2)
tap(find('Upgrade preservation check'))
tap(find('Circuit 0',scroll=True))
arrow=find('Show Rating (A) options',scroll=True)
tap(arrow);assert not ime(),'Dropdown arrow opened Android keyboard'
tap(find('32'));assert not ime(),'Selecting dropdown opened Android keyboard'
tap(find('Show Rating (A) options'));find('6');find('32');assert not ime(),'Reopening dropdown opened keyboard'
tap(find('32'));tap(find('32',cls='android.widget.EditText'))
assert ime(),'Tapping the editable input did not open Android keyboard'
with open(out/'numeric-keyboard.png','wb') as f:subprocess.run(['adb','exec-out','screencap','-p'],stdout=f,check=True)
adb('shell','input','keyevent','4')
print('NATIVE_DROPDOWN_AND_IME_PASS')
