// Supabase Edge Function: nora-chat
// Secret required: GEMINI_API_KEY. Configure allowed origin when deploying.
const origins = new Set(["https://chiraawork-hue.github.io"]);
const headersFor = (origin:string) => ({
  "Access-Control-Allow-Origin": origins.has(origin) ? origin : "https://chiraawork-hue.github.io",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin",
  "Content-Type": "application/json",
});
Deno.serve(async (req) => {
  const origin=req.headers.get("origin")||"";
  const h=headersFor(origin);
  if(req.method==="OPTIONS")return new Response(null,{status:204,headers:h});
  if(req.method!=="POST")return new Response(JSON.stringify({error:"Method not allowed"}),{status:405,headers:h});
  if(!origins.has(origin))return new Response(JSON.stringify({error:"Origin not allowed"}),{status:403,headers:h});
  const geminiKey=Deno.env.get("GEMINI_API_KEY");
  if(!geminiKey)return new Response(JSON.stringify({error:"Server is missing GEMINI_API_KEY"}),{status:503,headers:h});
  let body:any;try{body=await req.json()}catch{return new Response(JSON.stringify({error:"Invalid JSON"}),{status:400,headers:h})}
  const mode=["free","guided","ielts"].includes(body.mode)?body.mode:"free";
  const messages=Array.isArray(body.messages)?body.messages.slice(-16):[];
  if(!messages.length||messages.some((m:any)=>!["user","assistant"].includes(m.role)||typeof m.content!=="string"||m.content.length>1400))
    return new Response(JSON.stringify({error:"Invalid conversation"}),{status:400,headers:h});
  const instructions={
    free:"Have friendly, natural, short English conversations. Respond directly to the user's last message and ask one relevant follow-up. Don't correct grammar mid-conversation.",
    guided:"Help practise English about studying abroad. Be encouraging and responsive; ask one relevant follow-up and avoid unsolicited corrections.",
    ielts:"Act as a professional IELTS-style speaking practice examiner. Ask one question at a time; no feedback during mock speaking. This is practice, not an official IELTS test."
  };
  const system=body.review?"Provide short, constructive English grammar and vocabulary feedback on the user's own messages. Give up to 3 real corrections; don't invent mistakes. Make no IELTS band score promises.":instructions[mode as keyof typeof instructions];
  const contents=messages.map((m:any)=>({role:m.role==="assistant"?"model":"user",parts:[{text:m.content}]}));
  try{
    const resp=await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",{
      method:"POST",headers:{"Content-Type":"application/json","x-goog-api-key":geminiKey},
      body:JSON.stringify({systemInstruction:{parts:[{text:"You are Nora, an orange-cat English-speaking tutor for Planora Fluent. Speak only English. "+system}]},contents,generationConfig:{maxOutputTokens:320,temperature:0.75}})
    });
    const data=await resp.json();
    if(!resp.ok)return new Response(JSON.stringify({error:"Gemini request failed ("+resp.status+"). Check model availability and free-tier quota."}),{status:502,headers:h});
    const reply=data.candidates?.[0]?.content?.parts?.map((p:any)=>p.text||"").join("").trim();
    if(!reply)return new Response(JSON.stringify({error:"Gemini returned no reply"}),{status:502,headers:h});
    return new Response(JSON.stringify({reply}),{headers:h});
  }catch{return new Response(JSON.stringify({error:"Could not reach AI service"}),{status:502,headers:h})}
});
