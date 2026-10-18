import { Link } from "react-router-dom";
import { ArrowUpRight, ArrowRight, BookOpen, SlidersHorizontal, Compass, Users, Sparkles, Scan, Route, CircleHelp } from "lucide-react";
import { useAuth } from "@/lib/auth";
import "./Welcome.css";
const topics = [
 ["sense", "Sense the world", "From measurements to useful information.", Scan],
 ["feedback", "Close the loop", "Why feedback changes what happens next.", SlidersHorizontal],
 ["uncertainty", "Work with uncertainty", "Explore noisy signals and imperfect estimates.", Sparkles],
 ["planning", "Choose a path", "Understand goals, constraints, and trade-offs.", Route],
 ["human", "Keep people in the loop", "Know when a system should ask for help.", Users],
 ["systems", "See the whole system", "Bring sensing, decisions, and action together.", Compass],
];
function AutonomyWorld() {
 return <div className="welcome-world">
  <div className="world-caption"><span className="world-dot"/> A SYSTEM THAT LEARNS FROM FEEDBACK</div>
  <svg viewBox="0 0 620 420" role="img" aria-label="An inspection robot following a path through a greenhouse">
   <defs><linearGradient id="terrain" x2="1" y2="1"><stop stopColor="#d9e8da"/><stop offset="1" stopColor="#b0cfc3"/></linearGradient><linearGradient id="glass" x2="0" y2="1"><stop stopColor="#ffffff" stopOpacity=".7"/><stop offset="1" stopColor="#aac9bf" stopOpacity=".5"/></linearGradient></defs>
   <ellipse cx="317" cy="355" rx="242" ry="35" fill="#0e3d3b" opacity=".08"/>
   <path d="M45 255 300 115 584 260 324 400Z" fill="url(#terrain)"/>
   <path d="M45 255v15l279 145v-15ZM324 400l260-140v14L324 415Z" fill="#83aca0"/>
   <path d="m106 258 109-59 143 74-107 62Z" fill="#eaf1e5"/>
   <path d="m219 202 140-73 138 72-140 77Z" fill="#ddece5" stroke="#7eaaa1"/>
   <path d="M219 202v-92l70-76 70 23 138 72v72l-140 77v-99Z" fill="url(#glass)" stroke="#739e93" strokeWidth="2"/>
   <path d="m219 110 138 69 140-73-140-72-68 0ZM357 179v99M289 34v168m138-96v131M219 157l138 70 140-73" fill="none" stroke="#5d9187" strokeWidth="2"/>
   {[0,1,2,3,4].map(i=><g key={i} transform={`translate(${265+i*30},${187+i*15})`}><path d="M-15 5 16-12 31-4 1 13Z" fill="#779567"/><path d="M3 2v-25m0 10c-22 0-18-19-10-12 8 3 10 10 10 12 4-18 21-17 15-7-3 4-9 7-15 7" fill="#507c56" stroke="#507c56" strokeWidth="2"/></g>)}
   <path d="m115 272 143 73q26 12 49-2l156-85" fill="none" stroke="#f9fbef" strokeWidth="14" strokeLinecap="round"/>
   <path d="m115 272 143 73q26 12 49-2l156-85" fill="none" stroke="#669d91" strokeWidth="2" strokeDasharray="6 7"/>
   <g transform="translate(269 322)"><ellipse cy="15" rx="32" ry="11" fill="#163e3e" opacity=".2"/><circle cx="-22" cy="6" r="11" fill="#23484c"/><circle cx="22" cy="6" r="11" fill="#23484c"/><path d="m-28-8 28-13 28 13v17L0 21-28 8Z" fill="#f7faf0" stroke="#5f8982"/><path d="m-28-8 28 12 28-12M0 4v17" fill="none" stroke="#87aaa0"/><rect x="-9" y="-28" width="18" height="16" rx="5" fill="#23484c"/><circle cy="-21" r="4" fill="#e0b56c"/><path d="M-5-30-60-83 34-100 5-30" fill="#e3b568" opacity=".22"/></g>
   <g fill="#688e82"><circle cx="122" cy="220" r="18"/><circle cx="146" cy="205" r="14"/><path d="M122 224v23m24-34v19" stroke="#476756" strokeWidth="5"/></g>
  </svg>
  <div className="world-loop">{["Sense", "Decide", "Act", "Check"].map((word,i)=><span key={word}><b>0{i+1}</b>{word}{i<3&&<ArrowRight size={14}/>}</span>)}</div>
  <div className="world-footnote">A greenhouse inspection robot · one everyday example</div>
 </div>;
}
export default function Landing() {
 const { user } = useAuth();
 return <div className="welcome">
  <section className="welcome-hero"><div className="welcome-copy"><span className="welcome-eyebrow"><span/> A NEW WAY TO UNDERSTAND AUTONOMY</span>
   <h1>Go from<br/>“how does it work?”<br/>to <em>“now I see.”</em></h1>
   <p>Explore how autonomous systems sense, decide, and act. Build your understanding through guided lessons, experiments, and feedback that helps you move forward.</p>
   <div className="welcome-actions"><Link to="/learn" data-testid="hero-start" className="soa-btn-primary">{user ? "Continue learning" : "Explore the foundations"}<ArrowRight size={17}/></Link><Link to="/learn/uncertainty" className="welcome-text-link">Try an experiment <ArrowUpRight size={16}/></Link></div>
   <div className="welcome-small"><BookOpen size={15}/> Six guided lessons <span>·</span> Explore freely <span>·</span> Learn at your pace</div>
  </div><AutonomyWorld/></section>
  <section className="welcome-method" aria-label="How learning works">{[["01","Make a prediction","Start with what you think will happen."],["02","Try it for yourself","Change a variable. Watch the system respond."],["03","Explain what changed","Use feedback to deepen your understanding."]].map(([n,t,d])=><div key={n}><span>{n}</span><div><h2>{t}</h2><p>{d}</p></div></div>)}</section>
  <section className="welcome-course"><div className="welcome-section-heading"><div><span className="welcome-eyebrow">YOUR STARTING POINT</span><h2>One foundation.<br/>A world of possibilities.</h2></div><p>No previous robotics experience needed. Follow a connected course, then go deeper into the topics that spark your curiosity.</p></div>
   <div className="welcome-topics">{topics.map(([id,t,d,Icon],i)=><Link key={id} to={`/learn/${id}`}><div className="welcome-topic-top"><Icon size={23}/><span>0{i+1} / 06</span></div><h3>{t}</h3><p>{d}</p><span className="welcome-topic-link">Explore lesson <ArrowUpRight size={17}/></span></Link>)}</div>
  </section>
  <section className="welcome-paths"><div><span className="welcome-eyebrow">ROOM TO KEEP EXPLORING</span><h2>Follow your curiosity.</h2><p>Choose simpler explanations or deeper technical notes within the course. Your starting point is a preference, never a label on your potential.</p></div><div className="welcome-path-links"><Link to="/simulator"><Compass/><div><h3>Flight playground</h3><p>Explore movement and control in a coastal simulation.</p></div><ArrowUpRight/></Link><Link to="/tracks"><BookOpen/><div><h3>Topic library</h3><p>Browse the wider collection of autonomy lessons.</p></div><ArrowUpRight/></Link><Link to="/assessment"><CircleHelp/><div><h3>Dronability practice</h3><p>Optional spatial and attention activities. Practice feedback, not an aptitude verdict.</p></div><ArrowUpRight/></Link></div></section>
  <section className="welcome-teaching"><Users size={30}/><div><span className="welcome-eyebrow">LEARN TOGETHER</span><h2>A clearer view of your classroom.</h2><p>Instructors can organise cohorts, share a course, and see where learners need another explanation.</p></div><Link to={user ? "/instructor" : "/login"} className="soa-btn-secondary">Instructor workspace <ArrowRight size={16}/></Link></section>
 </div>;
}
