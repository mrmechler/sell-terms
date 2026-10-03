(function(){
  const enc=new TextEncoder();
  function canvasFor({brand,title,subtitle,accent,rows,footnote}){
    const c=document.createElement('canvas');c.width=1200;c.height=1500;
    const ctx=c.getContext('2d'),dark='#1d1d1f',muted='#64646b';
    ctx.fillStyle='#fff';ctx.fillRect(0,0,1200,1500);
    ctx.fillStyle=accent;ctx.fillRect(0,0,1200,16);
    ctx.textBaseline='top';ctx.fillStyle=dark;ctx.font='700 34px Arial';ctx.fillText(brand,76,72);
    ctx.fillStyle=muted;ctx.font='24px Arial';ctx.fillText(new Date().toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'}),76,126);
    ctx.fillStyle=dark;ctx.font='700 68px Arial';ctx.fillText(title,76,210);
    ctx.fillStyle=muted;ctx.font='27px Arial';ctx.fillText(subtitle,76,300);
    let y=390;
    for(const row of rows){
      if(row.heading){ctx.fillStyle=accent;ctx.font='700 25px Arial';ctx.fillText(row.heading.toUpperCase(),76,y);y+=72;continue}
      ctx.fillStyle='#e5e5e8';ctx.fillRect(76,y-10,1048,2);
      ctx.fillStyle=muted;ctx.font='27px Arial';ctx.fillText(row.label,76,y+20);
      ctx.fillStyle=dark;ctx.font='700 33px Arial';ctx.textAlign='right';ctx.fillText(String(row.value),1124,y+14);ctx.textAlign='left';y+=91;
    }
    ctx.fillStyle='#edf5ee';ctx.fillRect(76,1260,1048,185);
    ctx.fillStyle=muted;ctx.font='21px Arial';wrap(ctx,footnote,100,1289,1000,28);
    return c;
  }
  function wrap(ctx,str,x,y,width,lineHeight){
    let line='';
    for(const word of str.split(' ')){
      const next=line?line+' '+word:word;
      if(ctx.measureText(next).width>width&&line){ctx.fillText(line,x,y);y+=lineHeight;line=word}
      else line=next;
    }
    if(line)ctx.fillText(line,x,y);
  }
  function blobFrom(canvas,type,quality){
    return new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('Unable to create file.')),type,quality));
  }
  function save(blob,name){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),30000)}
  function pdfFromJpeg(jpeg){
    const head=enc.encode('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');
    const parts=[head],offsets=[0];let length=head.length;
    function add(n,body,data){offsets[n]=length;let start=enc.encode(n+' 0 obj\n'+body);parts.push(start);length+=start.length;if(data){parts.push(data);length+=data.length}let end=enc.encode(data?'\nendstream\nendobj\n':'\nendobj\n');parts.push(end);length+=end.length}
    add(1,'<< /Type /Catalog /Pages 2 0 R >>');
    add(2,'<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
    add(3,'<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /XObject << /Im1 4 0 R >> >> /Contents 5 0 R >>');
    add(4,'<< /Type /XObject /Subtype /Image /Width 1200 /Height 1500 /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length '+jpeg.length+' >>\nstream\n',jpeg);
    const stream=enc.encode('q\n572 0 0 715 20 38 cm\n/Im1 Do\nQ\n');
    add(5,'<< /Length '+stream.length+' >>\nstream\n',stream);
    const xref=length;let table='xref\n0 6\n0000000000 65535 f \n';
    for(let n=1;n<=5;n++)table+=String(offsets[n]).padStart(10,'0')+' 00000 n \n';
    table+='trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n'+xref+'\n%%EOF';
    parts.push(enc.encode(table));
    return new Blob(parts,{type:'application/pdf'});
  }
  async function pdf(data,name){const canvas=canvasFor(data),blob=await blobFrom(canvas,'image/jpeg',.94);save(pdfFromJpeg(new Uint8Array(await blob.arrayBuffer())),name+'.pdf')}
  async function share(data,name,status){
    const canvas=canvasFor(data),blob=await blobFrom(canvas,'image/png'),file=new File([blob],name+'.png',{type:'image/png'});
    try{
      if(navigator.canShare?.({files:[file]})&&navigator.share){await navigator.share({files:[file],title:data.title,text:data.subtitle});status.textContent='Graphic shared.';return}
    }catch(e){if(e.name==='AbortError')return}
    save(blob,name+'.png');status.textContent='Graphic downloaded. Attach it to a text or email.';
  }
  window.FinanceExport={pdf,share};
})();
