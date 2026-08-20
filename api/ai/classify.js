export default async function handler(req,res){
  if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
  if(!process.env.GROQ_API_KEY)return res.status(500).json({error:'GROQ_API_KEY is not configured'});
  try{
    const {message,senderName,platform}=req.body||{};
    if(!message||typeof message!=='string')return res.status(400).json({error:'message is required'});
    const prompt=`Classify this incoming creator/social-media DM. Return ONLY valid JSON with exactly these fields: category, priority_score, priority_level, relevance_score, is_spam, needs_reply. category must be one of sponsorship, brand_deal, collaboration, business, partnership, question, content_request, feedback, important, relevant, general, spam. priority_score and relevance_score must be integers from 0 to 100. priority_level must be one of high, medium, low. is_spam and needs_reply must be booleans.\n\nPlatform: ${platform||'unknown'}\nSender: ${senderName||'unknown'}\nMessage: ${message}`;
    const response=await fetch('https://api.groq.com/openai/v1/chat/completions',{
      method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${process.env.GROQ_API_KEY}`},
      body:JSON.stringify({model:'llama-3.3-70b-versatile',messages:[{role:'system',content:'You are a precise message classification engine. Output JSON only.'},{role:'user',content:prompt}],temperature:0.1,response_format:{type:'json_object'}})
    });
    const data=await response.json();
    if(!response.ok)return res.status(response.status).json({error:data?.error?.message||'Groq request failed'});
    let result;
    try{result=JSON.parse(data?.choices?.[0]?.message?.content||'{}')}catch{return res.status(502).json({error:'Groq returned invalid JSON'})}
    const categories=['sponsorship','brand_deal','collaboration','business','partnership','question','content_request','feedback','important','relevant','general','spam'];
    const levels=['high','medium','low'];
    const score=v=>Math.max(0,Math.min(100,Math.round(Number(v)||0)));
    const normalized={category:categories.includes(result.category)?result.category:'general',priority_score:score(result.priority_score),priority_level:levels.includes(result.priority_level)?result.priority_level:'low',relevance_score:score(result.relevance_score),is_spam:typeof result.is_spam==='boolean'?result.is_spam:result.category==='spam',needs_reply:typeof result.needs_reply==='boolean'?result.needs_reply:true};
    return res.status(200).json(normalized);
  }catch(error){return res.status(500).json({error:error.message||'Classification failed'})}
}
