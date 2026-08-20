export default async function handler(req,res){
  if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
  if(!process.env.GROQ_API_KEY)return res.status(500).json({error:'GROQ_API_KEY is not configured'});
  try{
    const {message,senderName,platform}=req.body||{};
    if(!message||typeof message!=='string')return res.status(400).json({error:'message is required'});
    const prompt=`You are Kai, an AI communication intelligence system for social-media creators. Analyze the incoming DM carefully. Return ONLY valid JSON with exactly these fields: category, priority_score, priority_level, relevance_score, is_spam, needs_reply. Allowed category values: sponsorship, brand_deal, collaboration, business, partnership, question, content_request, feedback, important, relevant, general, spam. Explicit paid sponsorships, sponsored campaigns, paid promotions, brand offers, collaborations, partnerships and serious commercial/business proposals must NEVER be classified as general. Return priority_score as an integer 0-100. Clear paid sponsorships and high-value commercial opportunities should normally score 85-100. Set priority_level high for 75-100, medium for 45-74, low for 0-44. Platform: ${platform||'unknown'}. Sender: ${senderName||'unknown'}. Message: ${message}`;
    const model=process.env.GROQ_MODEL||'llama-3.1-8b-instant';
    const response=await fetch('https://api.groq.com/openai/v1/chat/completions',{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${process.env.GROQ_API_KEY}`},body:JSON.stringify({model,messages:[{role:'system',content:'You are a precise communication classification engine. Output JSON only.'},{role:'user',content:prompt}],temperature:0,response_format:{type:'json_object'}})});
    const data=await response.json();
    if(!response.ok)return res.status(response.status).json({error:data?.error?.message||`Groq request failed using model ${model}`});
    let result;try{result=JSON.parse(data?.choices?.[0]?.message?.content||'{}')}catch{return res.status(502).json({error:'Groq returned invalid JSON'})}
    const categories=['sponsorship','brand_deal','collaboration','business','partnership','question','content_request','feedback','important','relevant','general','spam'];
    const score=v=>Math.max(0,Math.min(100,Math.round(Number(v)||0)));
    const text=message.toLowerCase();
    let detected=null;
    if(/\bsponsor(ship|ed)?\b|\bpaid\s+(campaign|promotion|sponsorship)\b/.test(text))detected='sponsorship';
    else if(/\bbrand\s+deal\b|\bambassador\b|\bbrand\s+(partnership|campaign)\b/.test(text))detected='brand_deal';
    else if(/\bcollaborat(e|ion|ing)\b|\bcollab\b/.test(text))detected='collaboration';
    else if(/\bpartnership\b|\bpartner\s+with\b/.test(text))detected='partnership';
    else if(/\bcommercial\b|\bbusiness\s+(enquir|inquir)|\bproposal\b|\bcontract\b/.test(text))detected='business';
    let category=categories.includes(result.category)?result.category:'general';
    if(detected&&category==='general')category=detected;
    let priorityScore=score(result.priority_score);
    if(detected==='sponsorship')priorityScore=Math.max(priorityScore,85);
    else if(detected==='brand_deal'||detected==='business'||detected==='partnership')priorityScore=Math.max(priorityScore,80);
    else if(detected==='collaboration')priorityScore=Math.max(priorityScore,75);
    const normalized={category,priority_score:priorityScore,priority_level:priorityScore>=75?'high':priorityScore>=45?'medium':'low',relevance_score:Math.max(score(result.relevance_score),detected?80:0),is_spam:detected?false:(typeof result.is_spam==='boolean'?result.is_spam:category==='spam'),needs_reply:detected?true:(typeof result.needs_reply==='boolean'?result.needs_reply:true)};
    if(normalized.category==='spam'){normalized.priority_score=0;normalized.priority_level='low'}
    return res.status(200).json(normalized);
  }catch(error){return res.status(500).json({error:error.message||'Classification failed'})}
}