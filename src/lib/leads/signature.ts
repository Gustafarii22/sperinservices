/** Safe in both browser and server: the same immutable Sperin Services footer. */
export const BUSINESS_SIGNATURE=[
  'Augustine Sperin',
  'Electrical Contractor',
  'Sperin Services',
  'M: 07817 360 156',
  'E: info@sperinservices.co.uk',
  'W: sperinservices.co.uk'
].join('\n');

export function withBusinessSignature(body:string):string {
  const value=body.replace(/\r\n/g,'\n').trimEnd();
  if (/Augustine Sperin[\s\S]*info@sperinservices\.co\.uk/i.test(value)) return value;
  return value+'\n\n'+BUSINESS_SIGNATURE;
}
