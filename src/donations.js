/* Set the payment provider's official, reusable HTTPS payment link here.
 * Empty means no donation UI. Never use a made-up TWINT deep link or a phone number.
 * No payment SDK, third-party embed, tracking or requests are loaded by this module.
 */
(function(){
  const paymentUrl='';
  if(!paymentUrl)return;
  let url;try{url=new URL(paymentUrl);}catch{return;}
  if(url.protocol!=='https:'||url.username||url.password)return;
  const link=document.getElementById('twint-donation');
  const section=document.getElementById('support');
  if(!link||!section)return;
  link.href=url.href;
  section.hidden=false;
})();
