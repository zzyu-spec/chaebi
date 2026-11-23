export const day=d=>new Date(d+'T00:00:00Z');
export const iso=d=>d.toISOString().slice(0,10);
export const shift=(d,n)=>iso(new Date(+day(d)+n*86400000));
export function matches(r,d){
 if(d<r.start||(r.end&&d>r.end))return false;
 const dt=day(d),diff=Math.round((dt-day(r.start))/86400000),n=Math.max(1,+r.interval||1);
 if(r.type==='none')return d===r.start;
 if(r.type==='dates')return r.dates.includes(d);
 if(r.type==='daily')return diff%n===0;
 if(r.type==='weekly'){const a=day(r.start),offset=(a.getUTCDay()+6)%7;return Math.floor((diff+offset)/7)%n===0&&r.weekdays.includes(dt.getUTCDay());}
 if(r.type==='monthly')return r.monthMode==='day'?dt.getUTCDate()===+r.monthDay:dt.getUTCDay()===+r.monthWeekday&&(r.ordinal==='last'?new Date(+dt+7*86400000).getUTCMonth()!==dt.getUTCMonth():Math.ceil(dt.getUTCDate()/7)===+r.ordinal);
 return false;
}
export function occurrences(db,d){const out=[];for(const item of db.items){const key=item.id+'|'+d,o=db.overrides[key];if(o?.deleted)continue;const history=db.history[key];if(history){out.push({...history,...o,id:item.id,date:d,checked:!!db.checks[key]});continue;}if(((!item.frozenThrough||d>item.frozenThrough)&&item.rules.some(r=>matches(r,d)))||o?.title)out.push({...item,...o,id:item.id,date:d,checked:!!db.checks[key]});}return out;}
export function preserve(db,today){for(const item of db.items){const start=item.rules.map(r=>r.start).sort()[0];if(!start)continue;for(let d=start;d<today;d=shift(d,1)){const key=item.id+'|'+d;if((!item.frozenThrough||d>item.frozenThrough)&&!db.history[key]&&item.rules.some(r=>matches(r,d))&&!db.overrides[key]?.deleted)db.history[key]={title:item.title,category:item.category,note:item.note};}item.frozenThrough=shift(today,-1);}}
export function remove(db,id,d,scope,today){preserve(db,today);const item=db.items.find(i=>i.id===id);if(scope==='one')db.overrides[id+'|'+d]={deleted:true};else if(scope==='future'){for(const r of item.rules)if(!r.end||r.end>=d)r.end=shift(d,-1);for(const key of Object.keys(db.history))if(key.startsWith(id+'|')&&key.split('|')[1]>=d)delete db.history[key];for(const key of Object.keys(db.overrides))if(key.startsWith(id+'|')&&key.split('|')[1]>=d)delete db.overrides[key];}else{db.items=db.items.filter(i=>i.id!==id);for(const field of ['checks','history','overrides'])for(const key of Object.keys(db[field]))if(key.startsWith(id+'|'))delete db[field][key];}}
