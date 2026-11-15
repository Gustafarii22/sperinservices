import { describe,it,expect,vi } from 'vitest';
import { smsComposeLink,gmailComposeLink } from '@/lib/leads/mobile';
import { sendPhoneSms,phoneSmsStatus,missingConfig,sendGmail } from '@/lib/server/providers.server';
import { withBusinessSignature } from '@/lib/server/channels';

const cfg={smsGateUser:'gateway-user',smsGatePassword:'private-password'};
describe('free Samsung SMS gateway and Gmail integration (mocked, no live messages)',()=>{
 it('creates an SMS composer URL only for a valid UK mobile',()=>{
  expect(smsComposeLink('07911 123456','Hello £160')).toBe('sms:+447911123456?body=Hello%20%C2%A3160');
  expect(smsComposeLink('0121 555 1234','Hello')).toBeNull();
  expect(smsComposeLink('07911 123456','')).toBeNull();
 });
 it('prepares a proper Gmail compose URL without sending',()=>{
  const link=gmailComposeLink('a@example.com','Quote £160','Hello from Sperin');
  const url=new URL(link);
  expect(url.hostname).toBe('mail.google.com');
  expect(url.searchParams.get('to')).toBe('a@example.com');
  expect(url.searchParams.get('su')).toBe('Quote £160');
 });
 it('does not duplicate the business signature',()=>{
  const text=withBusinessSignature('Quote £160');
  expect(text).toContain('Augustine Sperin');
  expect(text).toContain('info@sperinservices.co.uk');
  expect(withBusinessSignature(text)).toBe(text);
 });
 it('requires free gateway credentials, never any Twilio variables',()=>{
  expect(missingConfig('sms',cfg)).toBeNull();
  expect(missingConfig('sms',{})).toMatch(/SMSGATE_USERNAME/);
 });
 it('sends approved text ONLY to free SMSGate, via owner's phone SIM',async()=>{
  const spy=vi.fn().mockResolvedValue(Response.json({id:'f633a903-08ee-4b98-a77b-05c7bc4eaa09',state:'Pending'}));
  const result=await sendPhoneSms({to:'+447911123456',body:'Job quote sent by email',channelId:'f633a903-08ee-4b98-a77b-05c7bc4eaa09'},cfg,spy);
  expect(result.status).toBe('sending');
  const [url,options]=spy.mock.calls[0];
  expect(url).toBe('https://api.sms-gate.app/3rdparty/v1/messages');
  expect(options.body).toContain('+447911123456');
  expect(options.body).toContain('f633a903-08ee-4b98-a77b-05c7bc4eaa09');
  expect(options.headers.Authorization).toMatch(/^Basic /);
 });
 it('refuses invalid numbers before making external calls',async()=>{
  const spy=vi.fn();
  const result=await sendPhoneSms({to:'0121 444 5555',body:'Hello',channelId:'q1'},cfg,spy);
  expect(result.status).toBe('failed');expect(spy).not.toHaveBeenCalled();
 });
 it('does not retry an uncertain accepted gateway response as a safe failure',async()=>{
  const spy=vi.fn().mockRejectedValue(new Error('Timeout'));
  const result=await sendPhoneSms({to:'+447911123456',body:'Hello',channelId:'abcdef234567'},cfg,spy);
  expect(result.status).toBe('unknown');
 });
 it('reads actual carrier-reported states from the free gateway',async()=>{
  const spy=vi.fn().mockResolvedValue(Response.json({id:'f633a903-08ee-4b98-a77b-05c7bc4eaa09',state:'Delivered'}));
  expect((await phoneSmsStatus('f633a903-08ee-4b98-a77b-05c7bc4eaa09',cfg,spy)).status).toBe('delivered');
 });
 it('allows the linked Sperin Gmail account, but no unrelated signed-in Gmail account',async()=>{
  const c={gmailClientId:'client',gmailClientSecret:'secret',gmailRefreshToken:'refresh'};
  const ok=vi.fn().mockResolvedValueOnce(Response.json({access_token:'tok'}))
    .mockResolvedValueOnce(Response.json({emailAddress:'sperinservices@gmail.com'}))
    .mockResolvedValueOnce(Response.json({id:'google-msg-id'}));
  expect((await sendGmail({to:'a@example.com',subject:'Quote',body:'Hello',key:'key'},c,ok)).status).toBe('sent');
  const wrong=vi.fn().mockResolvedValueOnce(Response.json({access_token:'tok'}))
    .mockResolvedValueOnce(Response.json({emailAddress:'another@gmail.com'}));
  expect((await sendGmail({to:'a@example.com',subject:'Quote',body:'Hello',key:'key'},c,wrong)).status).toBe('failed');
 });
});
