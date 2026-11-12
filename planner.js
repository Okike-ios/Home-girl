'use strict';
/*
 * Home Girl planning prototype: Calendar, My Tasks, Reminders, This Week.
 * Storage is browser-local (not Supabase); no background or native push alerts.
 * No HTML from user input is inserted unescaped.
 */
(function () {
  const KEY = 'homegirl-planner-v1';
  const AREA_NAMES = ['General', 'Nourishment', 'Home Care', 'Personal & Well-being', 'Home Improvement', 'Events', 'Financial System'];
  const today = () => {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  };
  const dateParts = s => {
    if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
    const p = s.split('-').map(Number), d = new Date(p[0], p[1] - 1, p[2]);
    if (d.getFullYear() !== p[0] || d.getMonth() !== p[1] - 1 || d.getDate() !== p[2]) return null;
    return d;
  };
  const toISO = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  const shift = (iso, days) => {const d = dateParts(iso); if (!d) return today(); d.setDate(d.getDate() + days); return toISO(d);};
  const escapeHTML = x => String(x == null ? '' : x).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const niceDate = (iso, opts) => {const d = dateParts(iso); return d ? d.toLocaleDateString(undefined, opts || {weekday:'short',month:'short',day:'numeric'}) : 'No date';};
  const isTime = s => typeof s === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(s);
  const uid = () => (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'hg-' + Date.now() + '-' + Math.random().toString(36).slice(2));
  function load() {
    try {
      const data = JSON.parse(localStorage.getItem(KEY) || '{}');
      return {
        tasks: Array.isArray(data.tasks) ? data.tasks.filter(x => x && typeof x.id === 'string' && dateParts(x.date) && typeof x.title === 'string') : [],
        reminders: Array.isArray(data.reminders) ? data.reminders.filter(x => x && typeof x.id === 'string' && dateParts(x.date) && isTime(x.time) && typeof x.title === 'string') : []
      };
    } catch {return {tasks:[],reminders:[]};}
  }
  let data = load();
  let current = 'calendar';
  let calendarMonth = new Date();
  calendarMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1);
  let selectedDate = today();
  let taskTab = 'today';
  let taskDateFilter = '';
  let reminderTab = 'upcoming';
  let reminderDateFilter = '';
  let formKind = 'task';
  const root = document.getElementById('planner-content');
  const dlg = document.getElementById('planner-dialog');
  const form = document.getElementById('planner-form');
  const heading = document.getElementById('planner-heading');
  const tagline = document.getElementById('planner-lead');
  const newButton = document.getElementById('planner-new');
  const newLabel = document.getElementById('planner-new-label');
  const alertToast = message => {
    const old = document.querySelector('.planner-toast'); if (old) old.remove();
    const el = document.createElement('div'); el.className = 'planner-toast'; el.setAttribute('role','status'); el.textContent = message;
    document.body.appendChild(el); setTimeout(() => el.remove(), 3500);
  };
  function save() {
    try {localStorage.setItem(KEY, JSON.stringify(data)); return true;}
    catch {alertToast('Could not save to this browser. Check storage permissions.'); return false;}
  }
  function taskActive(t) {return t.status !== 'completed' && t.status !== 'dismissed';}
  function dueTasks(date) {return data.tasks.filter(t => t.date === date && t.status !== 'dismissed');}
  function overdue() {return data.tasks.filter(t => taskActive(t) && t.date < today()).sort((a,b) => a.date.localeCompare(b.date));}
  function allTasksSorted(items) {return items.slice().sort((a,b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title));}
  function weekStart(iso) {const d = dateParts(iso); const offset = (d.getDay()+6)%7; d.setDate(d.getDate()-offset); return toISO(d);}
  function occurrence(rem, target) {
    const start = dateParts(rem.date), reference = dateParts(target);
    if (!start || !reference || reference < start) return null;
    const repeat = rem.repeat || 'none';
    if (repeat === 'none') return rem.date;
    const diff = Math.round((Date.UTC(reference.getFullYear(),reference.getMonth(),reference.getDate())-Date.UTC(start.getFullYear(),start.getMonth(),start.getDate()))/86400000);
    if (repeat === 'daily') return target;
    if (repeat === 'weekly') return shift(rem.date,Math.floor(diff/7)*7);
    if (repeat === 'monthly') {
      const months = (reference.getFullYear()-start.getFullYear())*12+reference.getMonth()-start.getMonth();
      const monthDate = n => {const first = new Date(start.getFullYear(),start.getMonth()+n,1); const max = new Date(first.getFullYear(),first.getMonth()+1,0).getDate(); return toISO(new Date(first.getFullYear(),first.getMonth(),Math.min(start.getDate(),max)));};
      const candidate=monthDate(months);
      return candidate<=target ? candidate : (months>0?monthDate(months-1):null);
    }
    return null;
  }
  function linkedTaskIsOpen(rem) {
    if (!rem.taskId) return true;
    const t = data.tasks.find(x => x.id === rem.taskId);
    return !!t && taskActive(t);
  }
  function dueReminders() {
    const now=new Date();
    return data.reminders.filter(r => {
      if (!linkedTaskIsOpen(r)) return false;
      const occ=occurrence(r,today()); if(!occ) return false;
      const due=new Date(occ+'T'+r.time+':00');
      const key=occ+'T'+r.time;
      return due<=now && r.acknowledged !== key;
    });
  }
  function remindersFor(date) {
    return data.reminders.filter(r=>linkedTaskIsOpen(r)&&occurrence(r,date)===date);
  }
  function updateReminderCount() {
    const count=dueReminders().length;
    document.querySelectorAll('.notification-dot,.tiny-dot').forEach(el=>{el.hidden = count===0;el.title=count + ' due reminder(s)';});
  }
  const quietButton=(label,action,id,extra='')=>'<button class="planner-link-button '+extra+'" type="button" data-plan-action="'+action+'" data-id="'+escapeHTML(id)+'">'+label+'</button>';
  const surface=(contents,extra='')=>'<div class="planner-surface '+extra+'">'+contents+'</div>';
  function lineItem(text,meta) {return '<div class="planner-inline-item"><span><span class="name">'+escapeHTML(text)+'</span><br><span class="note">'+escapeHTML(meta)+'</span></span></div>';}
  function empty(title,message) {return '<div class="planner-empty"><strong>'+escapeHTML(title)+'</strong>'+escapeHTML(message)+'</div>';}
  function renderCalendar() {
    const y=calendarMonth.getFullYear(),m=calendarMonth.getMonth(), first=(new Date(y,m,1).getDay()+6)%7, days=new Date(y,m+1,0).getDate();
    const title=calendarMonth.toLocaleDateString(undefined,{month:'long',year:'numeric'});
    let cells='';
    for(let i=0;i<Math.ceil((first+days)/7)*7;i++){
      const d=new Date(y,m,i-first+1),iso=toISO(d), inMonth=d.getMonth()===m;
      const count=dueTasks(iso).length,remCount=remindersFor(iso).length;
      cells+='<button type="button" class="planner-day'+(!inMonth?' is-outside':'')+(iso===selectedDate?' is-selected':'')+(iso===today()?' is-today':'')+'" data-plan-action="select-date" data-date="'+iso+'" aria-label="'+escapeHTML(niceDate(iso))+(count?' '+count+' task(s)':'')+(remCount?' '+remCount+' reminder(s)':'')+'" aria-pressed="'+String(iso===selectedDate)+'"><span class="planner-day-number">'+d.getDate()+'</span><span class="planner-day-dots">'+(count?'<i class="planner-day-dot"></i>':'')+(remCount?'<i class="planner-day-dot reminder"></i>':'')+'</span></button>';
    }
    const ts=dueTasks(selectedDate), rs=remindersFor(selectedDate);
    const selected=niceDate(selectedDate,{weekday:'long',month:'long',day:'numeric',year:'numeric'});
    const summary=surface('<h2 class="planner-aside-title">'+escapeHTML(selected)+'</h2><p class="planner-date-heading">Your household plans for this day</p>'+
      (ts.length?ts.map(t=>lineItem(t.title,t.status==='completed'?'Completed':t.area||'General')).join(''):empty('No tasks for this date','Choose a date or add a task.'))+
      '<div class="planner-jump-links"><button class="planner-small-button" data-plan-action="tasks-for-date">View day’s tasks</button><button class="planner-small-button" data-plan-action="reminders-for-date">Reminders</button><button class="planner-small-button" data-view="Events OS">Events</button></div>');
    const reminders=surface('<h2 class="planner-aside-title">Reminders</h2>'+(rs.length?rs.map(r=>lineItem(r.title,r.time+' · '+(r.repeat==='none'?'One-time':r.repeat))).join(''):empty('Nothing scheduled','Reminders appear when you create them.'))+
      '<div class="planner-jump-links"><button class="planner-small-button" data-plan-action="add-reminder-date">+ Add reminder</button></div>');
    root.innerHTML='<div class="planner-layout"><div class="planner-surface planner-calendar"><div class="planner-toolbar"><h2>'+escapeHTML(title)+'</h2><div class="planner-toolbar-actions"><button class="planner-small-button" data-plan-action="today">Today</button><button class="planner-round-button" data-plan-action="prev-month" aria-label="Previous month">‹</button><button class="planner-round-button" data-plan-action="next-month" aria-label="Next month">›</button></div></div><div class="planner-weekdays">'+['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(w=>'<div class="planner-weekday">'+w+'</div>').join('')+'</div><div class="planner-calendar-grid">'+cells+'</div></div><aside class="planner-aside">'+summary+reminders+'</aside></div>';
  }
  function taskRow(t){
    const done=t.status==='completed';
    const late=taskActive(t) && t.date<today();
    const archived=done && t.completedAt && t.completedAt.slice(0,10)<today();
    return '<div class="planner-task-row">'+
      '<input type="checkbox" class="planner-task-check" data-plan-action="toggle-task" data-id="'+escapeHTML(t.id)+'" aria-label="Mark '+escapeHTML(t.title)+' '+(done?'incomplete':'complete')+'" '+(done?'checked':'')+'>'+
      '<div class="planner-row-content"><p class="planner-row-title'+(done?' is-complete':'')+'">'+escapeHTML(t.title)+'</p><div class="planner-row-meta"><span>'+escapeHTML(niceDate(t.date))+'</span><span>·</span><span>'+escapeHTML(t.area||'General')+'</span>'+
        (late?'<span class="planner-badge warning">Overdue</span>':'')+(done?'<span class="planner-badge good">'+(archived?'History':'Completed')+'</span>':'')+'</div>'+
      (t.notes?'<p class="planner-row-notes">'+escapeHTML(t.notes)+'</p>':'')+'</div>'+
      '<div class="planner-row-actions">'+(taskActive(t)?quietButton('Edit','edit-task',t.id):'')+(late?quietButton('Reschedule','reschedule-task',t.id,'is-warning')+quietButton('Dismiss','dismiss-task',t.id,'is-danger'):'')+
      quietButton('Delete','delete-task',t.id,'is-danger')+'</div></div>';
  }
  function renderTasks(){
    const now=today(), late=overdue(), active=data.tasks.filter(taskActive), completed=data.tasks.filter(t=>t.status==='completed'), archive=completed.filter(t=>!t.completedAt || t.completedAt.slice(0,10)<now);
    let list=[], title='';
    if(taskDateFilter){list=dueTasks(taskDateFilter);title='Tasks for '+niceDate(taskDateFilter,{month:'long',day:'numeric',year:'numeric'});}
    else if(taskTab==='today'){list=data.tasks.filter(t=>t.date===now&&(taskActive(t)||(t.status==='completed'&&t.completedAt&&t.completedAt.slice(0,10)===now)));title='Today';}
    else if(taskTab==='upcoming'){list=active.filter(t=>t.date>=now);title='Upcoming tasks';}
    else if(taskTab==='overdue'){list=late;title='Overdue tasks';}
    else {list=completed;title='Completed & history';}
    const tabs=['today','upcoming','overdue','completed'].map(x=>'<button class="planner-tab'+(taskTab===x&&!taskDateFilter?' is-active':'')+'" type="button" data-plan-action="task-tab" data-tab="'+x+'">'+({today:'Today',upcoming:'Upcoming',overdue:'Overdue ('+late.length+')',completed:'Completed'}[x])+'</button>').join('');
    root.innerHTML='<div class="planner-stats"><div class="planner-stat"><div class="num">'+active.length+'</div><div class="label">Open tasks</div></div><div class="planner-stat"><div class="num">'+completed.length+'</div><div class="label">Completed</div></div><div class="planner-stat"><div class="num">'+late.length+'</div><div class="label">Need attention</div></div></div>'+
      (taskDateFilter?'<div class="planner-filter-notice"><span>Showing '+escapeHTML(niceDate(taskDateFilter))+' from Calendar</span><div class="planner-jump-links"><button class="planner-small-button" data-plan-action="date-reminders">Reminders</button><button class="planner-small-button" data-view="Events OS">Events</button><button class="planner-small-button" data-view="calendar">Calendar</button><button class="planner-small-button" data-plan-action="clear-task-filter">All tasks</button></div></div>':'')+
      (late.length?'<div class="planner-soft-banner"><strong>'+late.length+' overdue '+(late.length===1?'task needs':'tasks need')+' attention.</strong> Choose Reschedule or Dismiss for tasks you no longer plan to do.</div>':'')+
      '<div class="planner-tabs">'+tabs+'</div>'+surface('<div class="planner-toolbar"><h2>'+escapeHTML(title)+'</h2><span class="planner-muted">'+list.length+' task'+(list.length===1?'':'s')+'</span></div>'+
      (list.length?allTasksSorted(list).map(taskRow).join(''):empty('Nothing here yet',taskTab==='today'&&!taskDateFilter?'A peaceful day, or a perfect time to add your first task.':'Tasks will appear here as you plan your days.'))+
      (archive.length&&taskTab==='completed'?'<p class="planner-muted">Completed tasks from previous days appear here as history.</p>':''));
  }
  function reminderRow(r) {
    const linked=r.taskId?data.tasks.find(t=>t.id===r.taskId):null;
    const occ=occurrence(r,today()), isDue=dueReminders().some(x=>x.id===r.id);
    const next=occ&&occ===today()?today():r.date;
    return '<div class="planner-reminder-row"><div class="planner-row-content"><p class="planner-row-title">'+escapeHTML(r.title)+'</p><div class="planner-row-meta"><span>'+escapeHTML(niceDate(r.date))+' · '+escapeHTML(r.time)+'</span><span class="planner-badge">'+escapeHTML(r.repeat==='none'?'One-time':r.repeat)+'</span>'+(isDue?'<span class="planner-badge warning">Due now</span>':'')+'</div>'+
      (linked?'<p class="planner-row-notes">Task: '+escapeHTML(linked.title)+'</p>':'')+(r.notes?'<p class="planner-row-notes">'+escapeHTML(r.notes)+'</p>':'')+'</div>'+
      '<div class="planner-row-actions">'+(isDue?quietButton('Acknowledge','ack-reminder',r.id):'')+quietButton('Edit','edit-reminder',r.id)+quietButton('Delete','delete-reminder',r.id,'is-danger')+'</div></div>';
  }
  function renderReminders() {
    const due=dueReminders(), active=data.reminders.filter(linkedTaskIsOpen);
    let list=reminderTab==='due'?due:reminderTab==='all'?data.reminders:active;
    if(reminderDateFilter) list=list.filter(r=>occurrence(r,reminderDateFilter)===reminderDateFilter);
    list=list.slice().sort((a,b)=>(a.date+'T'+a.time).localeCompare(b.date+'T'+b.time));
    root.innerHTML='<div class="planner-soft-banner"><strong>Reminders are always your choice.</strong> This preview checks schedules while Home Girl is open. It cannot send notifications when the app or browser is closed.</div>'+
      (reminderDateFilter?'<div class="planner-filter-notice"><span>Reminders scheduled for '+escapeHTML(niceDate(reminderDateFilter))+'</span><button class="planner-small-button" data-plan-action="clear-reminder-filter">All reminders</button></div>':'')+
      '<div class="planner-tabs">'+[['upcoming','Scheduled'],['due','Due now ('+due.length+')'],['all','All reminders']].map(([key,label])=>'<button class="planner-tab'+(reminderTab===key?' is-active':'')+'" data-plan-action="reminder-tab" data-tab="'+key+'">'+label+'</button>').join('')+'</div>'+
      surface('<div class="planner-toolbar"><h2>'+escapeHTML(reminderTab==='due'?'Due reminders':'Your reminders')+'</h2><span class="planner-muted">'+list.length+' reminder'+(list.length===1?'':'s')+'</span></div>'+
        (list.length?list.map(reminderRow).join(''):empty('No reminders here','Create a reminder for anything you would like to remember.')));
  }
  function renderWeek(){
    const start=weekStart(today()),end=shift(start,6);
    const range=[],ts=data.tasks.filter(t=>t.date>=start&&t.date<=end&&t.status!=='dismissed'),remCount=data.reminders.filter(r=>{for(let k=0;k<7;k++)if(remindersFor(shift(start,k)).some(x=>x.id===r.id))return true;return false;}).length;
    for(let k=0;k<7;k++){const date=shift(start,k);range.push('<button class="planner-week-day'+(date===today()?' selected':'')+'" data-plan-action="week-day" data-date="'+date+'">'+escapeHTML(niceDate(date,{weekday:'short'}))+'<strong>'+date.slice(-2).replace(/^0/,'')+'</strong><span>'+dueTasks(date).length+' tasks</span></button>');}
    root.innerHTML='<div class="planner-soft-banner">A household-wide overview for '+escapeHTML(niceDate(start,{month:'long',day:'numeric'}))+' – '+escapeHTML(niceDate(end,{month:'long',day:'numeric',year:'numeric'}))+'. Nourishment meal planning remains a separate workspace.</div>'+
      '<div class="planner-stats"><div class="planner-stat"><div class="num">'+ts.length+'</div><div class="label">Tasks this week</div></div><div class="planner-stat"><div class="num">'+ts.filter(t=>t.status==='completed').length+'</div><div class="label">Completed</div></div><div class="planner-stat"><div class="num">'+remCount+'</div><div class="label">Reminder schedules</div></div></div>'+
      surface('<h2>Your week</h2><div class="planner-week-grid">'+range.join('')+'</div><div class="planner-week-summary"><div><h2>Tasks</h2>'+ (ts.length?allTasksSorted(ts).slice(0,7).map(t=>lineItem(t.title,niceDate(t.date))).join(''):empty('No tasks scheduled','Your week is ready when you are.'))+'</div><div><h2>Reminders</h2>'+ (remCount?'<p class="planner-muted">'+remCount+' reminder schedule(s) this week. Open Reminders to manage them.</p>':empty('No reminders scheduled','Add one whenever you need it.'))+'<button class="planner-small-button" data-view="reminders">View reminders</button></div></div>');
  }
  function render(view) {
    current=view;
    const labels={
      calendar:['Calendar','Your household dates and daily plans.','New task'],
      tasks:['My Tasks','Plan your responsibilities, one thing at a time.','New task'],
      reminders:['Reminders','A gentle nudge when you choose.','New reminder'],
      week:['This Week','A thoughtful overview of the days ahead.','New task']
    };
    const info=labels[view]||labels.calendar;
    heading.textContent=info[0];tagline.textContent=info[1];newLabel.textContent=info[2];
    document.getElementById('planner-eyebrow').textContent=view==='week'?'HOUSEHOLD OVERVIEW':'DAILY LIFE';
    if(view==='calendar')renderCalendar();
    else if(view==='tasks')renderTasks();
    else if(view==='reminders')renderReminders();
    else renderWeek();
    updateReminderCount();
  }
  function openForm(kind,edit,overrideDate) {
    formKind=kind;
    form.reset();
    const editing=edit || null;
    document.getElementById('planner-kind').value=kind;
    document.getElementById('planner-id').value=editing?editing.id:'';
    document.getElementById('planner-dialog-title').textContent=(editing?'Edit ':'New ')+(kind==='task'?'task':'reminder');
    document.getElementById('planner-title').placeholder=kind==='task'?'What needs doing?':'What would you like to remember?';
    document.getElementById('planner-title').value=editing?editing.title:'';
    document.getElementById('planner-date').value=editing?editing.date:(overrideDate||selectedDate||today());
    document.getElementById('planner-time').value=editing&&editing.time?editing.time:(kind==='reminder'?'09:00':'');
    document.getElementById('planner-time').required=kind==='reminder';
    document.getElementById('planner-time-field').hidden=kind==='task';
    document.getElementById('planner-category-field').hidden=kind==='reminder';
    document.getElementById('planner-linked-field').hidden=kind==='task';
    document.getElementById('planner-repeat-field').hidden=kind==='task';
    document.getElementById('planner-date-label').textContent=kind==='task'?'Due date':'Starting date';
    document.getElementById('planner-area').value=editing&&AREA_NAMES.includes(editing.area)?editing.area:'General';
    document.getElementById('planner-repeat').value=editing&&['none','daily','weekly','monthly'].includes(editing.repeat)?editing.repeat:'none';
    document.getElementById('planner-notes').value=editing?editing.notes||'':'';
    const selector=document.getElementById('planner-task-link');
    selector.innerHTML='<option value="">Standalone reminder</option>'+data.tasks.filter(taskActive).map(t=>'<option value="'+escapeHTML(t.id)+'">'+escapeHTML(t.title)+'</option>').join('');
    selector.value=editing?editing.taskId||'':'';
    document.getElementById('planner-form-note').textContent=kind==='reminder'?'In-app reminders appear only while Home Girl is open. Background phone alerts are not available in this prototype.':'Completed tasks stay visible for the day and move to history afterward.';
    if(typeof dlg.showModal==='function')dlg.showModal();else dlg.setAttribute('open','');
    document.getElementById('planner-title').focus();
  }
  function closeForm(){if(dlg.open&&typeof dlg.close==='function')dlg.close();else dlg.removeAttribute('open');}
  function submit(e) {
    e.preventDefault();
    if(!form.reportValidity())return;
    const title=document.getElementById('planner-title').value.trim(), date=document.getElementById('planner-date').value;
    if(!title||!dateParts(date)){alertToast('Please enter a title and a valid date.');return;}
    const id=document.getElementById('planner-id').value;
    const list=formKind==='task'?data.tasks:data.reminders;
    const currentRecord=list.find(x=>x.id===id);
    const base={id:currentRecord?currentRecord.id:uid(),title,date,notes:document.getElementById('planner-notes').value.trim().slice(0,500)};
    if(formKind==='task'){
      base.area=document.getElementById('planner-area').value;
      base.status=currentRecord?currentRecord.status:'active';
      base.completedAt=currentRecord?currentRecord.completedAt||null:null;
      base.createdAt=currentRecord?currentRecord.createdAt:new Date().toISOString();
    } else {
      const time=document.getElementById('planner-time').value;
      if(!isTime(time)){alertToast('Choose a valid reminder time.');return;}
      base.time=time;base.repeat=document.getElementById('planner-repeat').value;base.taskId=document.getElementById('planner-task-link').value;
      base.acknowledged=currentRecord&&currentRecord.date===date&&currentRecord.time===time&&currentRecord.repeat===base.repeat?currentRecord.acknowledged||'':'';
    }
    if(currentRecord)Object.assign(currentRecord,base);else list.push(base);
    save();closeForm();render(current);
  }
  function resolveAction(button) {
    const action=button.dataset.planAction, id=button.dataset.id, date=button.dataset.date;
    const task=data.tasks.find(x=>x.id===id), reminder=data.reminders.find(x=>x.id===id);
    if(action==='today'){selectedDate=today();calendarMonth=new Date(new Date().getFullYear(),new Date().getMonth(),1);}
    else if(action==='prev-month'||action==='next-month')calendarMonth=new Date(calendarMonth.getFullYear(),calendarMonth.getMonth()+(action==='prev-month'?-1:1),1);
    else if(action==='select-date'){selectedDate=date;const d=dateParts(date);calendarMonth=new Date(d.getFullYear(),d.getMonth(),1);taskDateFilter=date;taskTab='today';window.showView('tasks');return;}
    else if(action==='tasks-for-date'){taskDateFilter=selectedDate;taskTab='today';window.showView('tasks');return;}
    else if(action==='reminders-for-date'||action==='date-reminders'){reminderDateFilter=selectedDate;reminderTab='all';window.showView('reminders');return;}
    else if(action==='week-day'){selectedDate=date;calendarMonth=new Date(dateParts(date).getFullYear(),dateParts(date).getMonth(),1);window.showView('calendar');return;}
    else if(action==='add-reminder-date'){openForm('reminder',null,selectedDate);return;}
    else if(action==='task-tab'){taskTab=button.dataset.tab;taskDateFilter='';}
    else if(action==='clear-task-filter'){taskDateFilter='';taskTab='today';}
    else if(action==='reminder-tab'){reminderTab=button.dataset.tab;reminderDateFilter='';}
    else if(action==='clear-reminder-filter'){reminderDateFilter='';reminderTab='upcoming';}
    else if(action==='edit-task'&&task){openForm('task',task);return;}
    else if(action==='reschedule-task'&&task){openForm('task',task);return;}
    else if(action==='edit-reminder'&&reminder){openForm('reminder',reminder);return;}
    else if(action==='toggle-task'&&task){
      if(task.status==='completed'){task.status='active';task.completedAt=null;}
      else{task.status='completed';task.completedAt=new Date().toISOString();}
      save();
    }
    else if(action==='dismiss-task'&&task){if(!confirm('Dismiss this overdue task? It will no longer appear in your active tasks.'))return;task.status='dismissed';save();}
    else if(action==='delete-task'&&task){if(!confirm('Delete this task permanently?'))return;data.tasks=data.tasks.filter(x=>x.id!==id);data.reminders=data.reminders.map(r=>r.taskId===id?Object.assign({},r,{taskId:''}):r);save();}
    else if(action==='delete-reminder'&&reminder){if(!confirm('Delete this reminder permanently?'))return;data.reminders=data.reminders.filter(x=>x.id!==id);save();}
    else if(action==='ack-reminder'&&reminder){const occ=occurrence(reminder,today());if(occ)reminder.acknowledged=occ+'T'+reminder.time;save();}
    render(current);
  }
  root.addEventListener('click',e=>{const target=e.target.closest('[data-plan-action]');if(target&&target.dataset.planAction!=='toggle-task')resolveAction(target);});
  root.addEventListener('change',e=>{const target=e.target.closest('[data-plan-action="toggle-task"]');if(target)resolveAction(target);});
  newButton.addEventListener('click',()=>openForm(current==='reminders'?'reminder':'task',null,current==='calendar'?selectedDate:current==='tasks'&&taskDateFilter?taskDateFilter:current==='reminders'&&reminderDateFilter?reminderDateFilter:today()));
  document.getElementById('planner-close').addEventListener('click',closeForm);
  document.getElementById('planner-cancel').addEventListener('click',closeForm);
  form.addEventListener('submit',submit);
  // Visibility and simple open-tab checks only; do not imply native/background notifications.
  window.addEventListener('focus',()=>updateReminderCount());
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)updateReminderCount();});
  setInterval(()=>{if(!document.hidden)updateReminderCount();},60000);
  window.HomeGirlPlanner={render,selectDate(date){if(dateParts(date)){selectedDate=date;calendarMonth=new Date(dateParts(date).getFullYear(),dateParts(date).getMonth(),1);}},getState:()=>({tasks:data.tasks.length,reminders:data.reminders.length}),refresh:()=>render(current)};
  updateReminderCount();
})();
