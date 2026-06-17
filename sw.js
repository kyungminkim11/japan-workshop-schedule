self.addEventListener('install',event=>{self.skipWaiting()});
self.addEventListener('activate',event=>{event.waitUntil(self.clients.claim())});
self.addEventListener('notificationclick',event=>{
  event.notification.close();
  const target=event.notification&&event.notification.data&&event.notification.data.url||'./#timeline';
  event.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(list=>{
    const existing=list.find(client=>'focus'in client);
    if(existing){existing.navigate(target);return existing.focus()}
    if(self.clients.openWindow)return self.clients.openWindow(target)
  }))
});