import { useEffect, useState } from "react";
const moods=["peek","lean","wave","judge"];
export default function Coworker({transitionKey=0,compact=false}){
  const [mood,setMood]=useState(0);
  useEffect(()=>setMood(v=>(v+1)%moods.length),[transitionKey]);
  useEffect(()=>{const id=setInterval(()=>setMood(v=>(v+1)%moods.length),14000);return()=>clearInterval(id)},[]);
  return <div className={`coworker mood-${moods[mood]} ${compact?"compact":""}`} aria-hidden="true">
    <div className="legs"><i/><i/></div><div className="body"><b>2593</b><i className="arm left"/><i className="arm right"/></div><div className="neck"/><div className="head"><div className="hair"><i/><i/><i/><i/></div><i className="eye left"/><i className="eye right"/><i className="brow left"/><i className="brow right"/><i className="nose"/><i className="mouth"/></div>
  </div>;
}
