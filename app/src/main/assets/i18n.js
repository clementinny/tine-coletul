(function(root){
  'use strict';
  let language='ro',nodes=null,attributes=null;
  const english=root.CurierEnglish;
  function t(romanian,...values){
    const value=language==='en'?(Object.hasOwn(english,romanian)?english[romanian]:romanian):romanian;
    return typeof value==='string'&&values.length?value.replace(/\{(\d+)\}/g,(_,i)=>values[i]??''):value;
  }
  function scan(){
    nodes=[];
    attributes=[];
    const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
    for(let node=walker.nextNode();node;node=walker.nextNode()){
      if(!node.parentElement||node.parentElement.closest('script,style,[lang]:not(html)'))continue;
      const source=node.nodeValue.trim();
      if(Object.hasOwn(english,source))nodes.push([node,source,node.nodeValue]);
    }
    for(const element of document.querySelectorAll('[aria-label],[title]')){
      for(const key of ['aria-label','title']){
        const source=element.getAttribute(key);
        if(source&&Object.hasOwn(english,source))attributes.push([element,key,source]);
      }
    }
  }
  function select(value){
    if(!nodes)scan();
    language=value==='en'?'en':'ro';
    document.documentElement.lang=language;
    document.title=t('Ține coletul! — Haos în cartier');
    for(const [node,source,original] of nodes)if(node.isConnected)node.nodeValue=original.replace(source,()=>t(source));
    for(const [element,key,source] of attributes)if(element.isConnected)element.setAttribute(key,t(source));
  }
  root.CurierI18n={t,select,get language(){return language;}};
})(globalThis);
