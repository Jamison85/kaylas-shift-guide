import {useEffect,useMemo,useState} from "react";
import {guideTasks,wisdomLines,closingLines} from "./data/guide";
import {useLocalStorage} from "./hooks/useLocalStorage";
import Coworker from "./components/Coworker";
import TaskFocus from "./components/TaskFocus";
const dateKey=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`};
const pick=(arr,seed)=>arr[[...seed].reduce((n,c,i)=>n+c.charCodeAt(0)*(i+1),0)%arr.length];
export default function App(){
 const day=dateKey(),[progress,setProgress]=useLocalStorage(`kayla-guide-${day}`,{completed:[],currentIndex:0});
 const [screen,setScreen]=useState("splash"),[motion,setMotion]=useState(0);
 const wisdom=useMemo(()=>pick(wisdomLines,day),[day]),closing=useMemo(()=>pick(closingLines,day+"close"),[day]);
 const done=new Set(progress.completed||[]),count=done.size,index=Math.min(progress.currentIndex||0,guideTasks.length-1),task=guideTasks[index];
 useEffect(()=>{const a=setTimeout(()=>setScreen("home"),3900);return()=>clearTimeout(a)},[]);
 const go=i=>{const n=Math.max(0,Math.min(i,guideTasks.length-1));setProgress(p=>({...p,currentIndex:n}));setMotion(x=>x+1);setScreen("task")};
 const complete=()=>{const was=done.has(task.id),next=was?progress.completed.filter(x=>x!==task.id):[...(progress.completed||[]),task.id];setProgress(p=>({...p,completed:next,currentIndex:!was&&index<guideTasks.length-1?index+1:index}));setMotion(x=>x+1);if(!was&&count+1===guideTasks.length)setTimeout(()=>setScreen("complete"),220)};
 const reset=()=>{setProgress({completed:[],currentIndex:0});setScreen("home");setMotion(x=>x+1)};
 if(screen==="splash")return <main className="splash"><div className="splash-copy"><small>SHIFT GUIDE · 2593</small><h1>Good morning, Kayla.</h1><p>{wisdom}</p><button onClick={()=>setScreen("home")}>Start shift</button></div><Coworker transitionKey={wisdom}/></main>;
 return <div className="shell"><header className="mini"><button onClick={()=>setScreen("home")}><i/><span><b>Kayla's Shift Guide</b><small>Casey's 2593</small></span></button><Coworker compact transitionKey={motion}/></header><main className="content">
 {screen==="home"&&<section className="home"><div className="home-head"><div><small>Good morning, Kayla</small><h1>{Math.round(count/guideTasks.length*100)}% done</h1></div><b style={{"--p": Math.round(count/guideTasks.length*360)}}>{count}/{guideTasks.length}</b></div><button className="start" onClick={()=>go(index)}><small>Start here</small><strong>{count?"Continue the morning guide":"Begin the morning guide"}</strong><p>One task at a time. The store can manufacture its own chaos.</p><span>{count?"Continue":"Start"} →</span></button><div className="character-stage"><p><small>Today's coworker energy</small><b>Helpful. Slightly concerned. Somehow already caffeinated.</b></p><Coworker transitionKey={motion}/></div></section>}
 {screen==="task"&&<TaskFocus task={task} index={index} total={guideTasks.length} done={done.has(task.id)} onComplete={complete} onBack={()=>go(index-1)} onNext={()=>go(index+1)}/>} 
 {screen==="complete"&&<section className="finish"><div><small>Morning guide complete</small><h1>Kayla, you survived the paperwork.</h1><p>{closing}</p><button className="primary" onClick={()=>setScreen("home")}>Back home</button><button onClick={reset}>Reset today</button></div><Coworker transitionKey={closing}/></section>}
 </main>{screen!=="complete"&&<nav><button className={screen==="home"?"active":""} onClick={()=>setScreen("home")}>⌂<small>Home</small></button><button className={screen==="task"?"active":""} onClick={()=>go(index)}>✓<small>Guide</small></button><button onClick={reset}>↻<small>Reset</small></button></nav>}</div>
}
