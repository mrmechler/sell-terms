(function(){
  const money = n => new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(Number.isFinite(n)?n:0);
  const num = (v,max=1e9) => Math.min(max,Math.max(0,Number(v)||0));
  function payment(principal, annualRate, months){
    if(principal<=0||months<=0)return 0;
    const r=annualRate/1200;
    return r ? principal*r/(1-Math.pow(1+r,-months)) : principal/months;
  }
  function balance(principal, annualRate, months, paid){
    if(principal<=0)return 0;
    const r=annualRate/1200;
    const p=payment(principal,annualRate,months);
    if(!r)return Math.max(0,principal-p*Math.min(months,paid));
    const n=Math.min(months,paid);
    return Math.max(0,principal*Math.pow(1+r,n)-p*(Math.pow(1+r,n)-1)/r);
  }
  function period(principal,rate,termYears,years){
    const n=Math.min(termYears*12,years*12),pi=payment(principal,rate,termYears*12),remaining=balance(principal,rate,termYears*12,n);
    return {monthly:pi,balance:remaining,interest:Math.max(0,pi*n-(principal-remaining)),months:n};
  }
  function down(price,value,mode){return mode==='percent'?Math.min(price,price*num(value,100)/100):Math.min(price,num(value));}
  window.FinanceMath={money,num,payment,balance,period,down};
})();
