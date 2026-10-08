"""Exercise native IME behaviour on the actual signed APK using accessibility nodes."""
import subprocess,re,time,xml.etree.ElementTree as ET,pathlib
out=pathlib.Path('certificate-android/qa-output/android')
def adb(*args):return subprocess.check_output(['adb',*args],text=True)
def nodes():
    adb('shell','uiautomator','dump','/sdcard/keyboard.xml')
    return list(ET.fromstring(adb('shell','cat','/sdcard/keyboard.xml')).iter('node'))
def find(label,cls=None,scroll=False,not_edit=False,prefix=False):
    for _ in range(45 if scroll else 4):
        for n in nodes():
            if (any((v.startswith(label) if prefix else v==label) for v in [n.get('text',''),n.get('content-desc','')])) and (not cls or n.get('class')==cls) and (not not_edit or n.get('class')!='android.widget.EditText'):
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
tap(find('Continue Upgrade preservation check',cls='android.widget.Button',scroll=True))
tap(find('Circuit 0',cls='android.widget.Button',scroll=True,prefix=True))
arrow=find('Show Rating (A) options',scroll=True)
# Put the control away from the viewport edge so the complete popup is genuinely visible/tappable.
adb('shell','input','swipe','500','1500','500','1050','180');time.sleep(.5)
arrow=find('Show Rating (A) options')
tap(arrow);assert not ime(),'Dropdown arrow opened Android keyboard'
with open(out/'dropdown-open.png','wb') as f:subprocess.run(['adb','exec-out','screencap','-p'],stdout=f,check=True)
adb('shell','uiautomator','dump','/sdcard/dropdown-open.xml')
(out/'dropdown-open.xml').write_text(adb('shell','cat','/sdcard/dropdown-open.xml'))
tap(find('6',not_edit=True));assert not ime(),'Selecting dropdown opened Android keyboard'
tap(find('Show Rating (A) options'));find('2');find('6');assert not ime(),'Reopening dropdown opened keyboard'
tap(find('6',not_edit=True));tap(find('6',cls='android.widget.EditText'))
assert ime(),'Tapping the editable input did not open Android keyboard'
with open(out/'numeric-keyboard.png','wb') as f:subprocess.run(['adb','exec-out','screencap','-p'],stdout=f,check=True)
adb('shell','input','keyevent','4')
print('NATIVE_DROPDOWN_AND_IME_PASS')
