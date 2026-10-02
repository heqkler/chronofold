"use strict";
/* ---------- levels ---------- */
const LEVELS = [
  {
    name:"01 · FIRST ECHO", maxEchoes:1, par:1,
    hint:"Stand on the plate. Press R. Your echo remembers.",
    spawn:[60,466],
    solids:[[0,500,960,40]],
    plates:[{id:"p1",x:330,y:500,w:64}],
    doors:[{x:600,y:170,w:16,h:330,req:["p1"]}],
    lifts:[], lasers:[],
    exit:[860,456]
  },
  {
    name:"02 · DOUBLE EXPOSURE", maxEchoes:2, par:2,
    hint:"Two plates. One of you — for now.",
    spawn:[60,466],
    solids:[[0,500,960,40],[420,400,120,16]],
    plates:[{id:"p1",x:200,y:500,w:64},{id:"p2",x:448,y:400,w:64}],
    doors:[{x:700,y:170,w:16,h:330,req:["p1","p2"]}],
    lifts:[], lasers:[],
    exit:[880,456]
  },
  {
    name:"03 · STEPPING STONE", maxEchoes:2, par:2,
    hint:"Echoes are solid. Climb yourself.",
    spawn:[60,466],
    solids:[[0,500,960,40],[560,430,90,70],[700,310,260,16]],
    plates:[{id:"p1",x:140,y:500,w:64}],
    doors:[{x:480,y:170,w:16,h:330,req:["p1"]}],
    lifts:[], lasers:[],
    exit:[880,266]
  },
  {
    name:"04 · LIFT PROTOCOL", maxEchoes:1, par:1,
    hint:"Echoes repeat your TIMING too. Wait — give your future self time to board.",
    spawn:[60,466],
    solids:[[0,500,960,40],[560,250,180,16]],
    plates:[{id:"p1",x:300,y:500,w:64}],
    doors:[],
    lifts:[{x:820,y:486,w:110,h:14,up:270,speed:1.25,req:["p1"]}],
    lasers:[],
    exit:[610,206]
  },
  {
    name:"05 · PHASE GATES", maxEchoes:2, par:1,
    hint:"Lasers can't touch an echo. You are not so lucky.",
    spawn:[60,466],
    solids:[[0,500,960,40]],
    plates:[{id:"p1",x:690,y:500,w:64}],
    doors:[{x:840,y:170,w:16,h:330,req:["p1"]}],
    lifts:[],
    lasers:[
      {x:380,y:170,w:12,h:330,period:140,duty:70,offset:0},
      {x:520,y:170,w:12,h:330,period:140,duty:70,offset:70}
    ],
    exit:[900,456]
  },
  {
    name:"06 · GRAND PARADOX", maxEchoes:3, par:3,
    hint:"Three timelines. One conductor. Make them agree.",
    spawn:[50,466],
    solids:[[0,500,960,40],[520,290,440,16]],
    plates:[
      {id:"p1",x:130,y:500,w:60},
      {id:"p2",x:560,y:500,w:60},
      {id:"p3",x:600,y:290,w:60}
    ],
    doors:[
      {x:300,y:170,w:16,h:330,req:["p1"]},
      {x:760,y:20,w:16,h:270,req:["p1","p3"]}
    ],
    lifts:[{x:420,y:486,w:100,h:14,up:216,speed:1.25,req:["p2"]}],
    lasers:[{x:352,y:170,w:12,h:330,period:160,duty:80,offset:40}],
    exit:[900,246]
  },
  {
    name:"07 · FLIP SIDE", maxEchoes:2, par:1,
    hint:"Toggles flip EVERY crossing. Door B wants T1 off — mind your parity.",
    spawn:[60,466],
    solids:[[0,500,960,40]],
    plates:[],
    toggles:[{id:"t1",x:448,y:500}],
    doors:[
      {x:560,y:170,w:16,h:330,req:["t1"]},
      {x:740,y:170,w:16,h:330,req:["!t1"]}
    ],
    lifts:[], lasers:[],
    exit:[880,456]
  },
  {
    name:"08 · HEAVY LIFTING", maxEchoes:1, par:1,
    hint:"Crates outlast timelines — what you move STAYS moved.",
    spawn:[60,466],
    solids:[[0,500,960,40],[170,430,150,16],[760,370,200,16]],
    plates:[{id:"p1",x:316,y:500,w:64},{id:"p2",x:520,y:500,w:64}],
    doors:[{x:650,y:170,w:16,h:330,req:["p1","p2"]}],
    lifts:[], lasers:[],
    crates:[[250,400],[660,470]],
    exit:[900,326]
  },
  {
    name:"09 · STATIC", maxEchoes:2, par:1,
    hint:"Static fields ERASE echoes. You can walk right through — route your past self HIGH.",
    spawn:[60,466],
    solids:[[0,500,960,40],[300,400,90,16],[540,400,90,16]],
    plates:[{id:"p1",x:700,y:500,w:64}],
    doors:[{x:840,y:170,w:16,h:330,req:["p1"]}],
    lifts:[], lasers:[],
    erasers:[{x:420,y:380,w:70,h:160}],
    exit:[900,456]
  },
  {
    name:"10 · FOLD EVERYTHING", maxEchoes:3, par:3,
    hint:"Crate. Static. Laser. Lift. Three echoes, one conductor — and the lift still needs TIMING.",
    spawn:[40,466],
    solids:[[0,500,960,40],[340,404,100,16],[585,404,90,16],[610,256,250,16]],
    plates:[{id:"p1",x:70,y:500,w:64},{id:"p2",x:380,y:500,w:64},{id:"p3",x:598,y:404,w:64}],
    doors:[
      {x:250,y:170,w:16,h:330,req:["p1"]},
      {x:730,y:272,w:16,h:228,req:["p3"]}
    ],
    lifts:[{x:860,y:486,w:100,h:14,up:230,speed:1.25,req:["p2"]}],
    lasers:[
      {x:500,y:264,w:12,h:140,period:150,duty:90,offset:0},
      {x:690,y:320,w:12,h:120,period:120,duty:60,offset:0}
    ],
    crates:[[150,470]],
    erasers:[{x:475,y:364,w:70,h:176}],
    exit:[640,212]
  }
];
