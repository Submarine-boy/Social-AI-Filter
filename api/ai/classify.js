export default async function handler(req,res){
  if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
  if(!process.env.GROQ_API_KEY)return res.status(500).json({error:'GROQ_API_KEY is not configured'});
  try{
    const {message,senderName,platform}=req.body||{};
    if(!message||typeof message!=='string')return res.status(400).json({error:'message is required'});
    const prompt=`You are Kai, an AI communication intelligence system for social-media creators. Analyze the incoming DM carefully.

Return ONLY valid JSON with exactly these fields:
category, priority_score, priority_level, relevance_score, is_spam, needs_reply.

Allowed category values:
sponsorship, brand_deal, collaboration, business, partnership, question, content_request, feedback, important, relevant, general, spam.

CATEGORY RULES:
- Use sponsorship for explicit paid sponsorships, sponsored campaigns, paid promotions, or a company offering payment to promote a product/service.
- Use brand_deal for commercial offers from a brand, product promotion proposals, ambassador deals, or brand partnerships that are not explicitly described as sponsorships.
- Use collaboration for invitations to collaborate, create together, guest appearances, joint projects, or co-created content.
- Use business for serious commercial enquiries, proposals, services, contracts, meetings, or professional opportunities.
- Use partnership for strategic or longer-term partnership proposals.
- Do NOT use general when a message clearly contains a sponsorship, brand, collaboration, partnership, paid campaign, commercial, or business opportunity.

PRIORITY_SCORE RULES: Return an INTEGER from 0 to 100.
90-100 = exceptional/high-value opportunity, urgent or time-sensitive paid/commercial deal.
75-89 = clear paid sponsorship, brand deal, business opportunity, or strong partnership/collaboration requiring attention.
55-74 = relevant message, meaningful question, useful request, or non-urgent collaboration.
30-54 = ordinary relevant communication.
1-29 = low-value or weakly relevant communication.
0 = spam or completely irrelevant.

Set priority_level from the score: high for 75-100, medium for 45-74, low for 0-44.
Set relevance_score as an INTEGER from 0 to 100 representing relevance to the creator.
Set is_spam to true only for genuine spam, scams, or clearly irrelevant promotional junk.
Set needs_reply to true when a useful response or follow-up is expected.

EXAMPLE: 'We love your content and would like to discuss a paid sponsorship campaign for our new product' MUST normally be category 'sponsorship', priority_score at least 85, priority_level 'high', high relevance, is_spam false, needs_reply true.

Platform: ${platform||'unknown'}
Sender: ${senderName||'unknown'}
Message: ${message}`;
    const response=await fetch('https://api.groq.com/openai/v1/chat/completions',{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${process.env.GROQ_API_KEY}`},body:JSON.stringify({model:'llama-3.3-70b-versatile',messages:[{role:'system',content:'You are a precise communication classification engine. Follow the category and scoring rules exactly. Output JSON only.'},{role:'user',content:prompt}],temperature:0,response_format:{type:'json_object'}})});
    const data=await response.json();
    if(!response.ok)return res.status(response.status).json({error:data?.error?.message||'Groq request failed'});
    let result;try{result=JSON.parse(data?.choices?.[0]?.message?.content||'{}')}catch{return res.status(502).json({error:'Groq returned invalid JSON'})}
    const categories=['sponsorship','brand_deal','collaboration','business','partnership','question','content_request','feedback','important','relevant','general','spam'];
    const levels=['high','medium','low'];
    const score=v=>Math.max(0,Math.min(100,Math.round(Number(v)||0)));
    const priorityScore=score(result.priority_score);
    const normalized={category:categories.includes(result.category)?result.category:'general',priority_score:priorityScore,priority_level:priorityScore>=75?'high':priorityScore>=45?'medium':'low',relevance_score:score(result.relevance_score),is_spam:typeof result.is_spam==='boolean'?result.is_spam:result.category==='spam',needs_reply:typeof result.needs_reply==='boolean'?result.needs_reply:true};
    if(normalized.category==='spam'){normalized.priority_score=0;normalized.priority_level='low'}
    return res.status(200).json(normalized);
  }catch(error){return res.status(500).json({error:error.message||'Classification failed'})}
}