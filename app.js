(function(){
  const F=window.FinanceMath,$=id=>document.getElementById(id),val=id=>F.num($(id).value),put=(id,value)=>$(id).textContent=value,money=F.money;
  const modes={sellerDown:'percent',bankDown:'percent',sellerBroker:'percent',buyerBroker:'percent',tax:'percent',insurance:'dollar'};
  for(let y=1;y<=10;y++){const option=document.createElement('option');option.value=y;option.textContent=y+(y===1?' year':' years');if(y===5)option.selected=true;$('balloon').append(option)}
  function amount(id,base){return modes[id]==='percent'?base*Math.min(100,val(id))/100:val(id)}
  function scenario(){
    const price=val('price'),years=val('balloon'),lien=val('liens');
    const sellerDown=F.down(price,val('sellerDown'),modes.sellerDown),bankDown=F.down(price,val('bankDown'),modes.bankDown);
    const paymentType=$('sellerPaymentType').value;
    const principal=price-sellerDown,rate=Math.min(100,val('sellerRate'));
    const seller=paymentType==='interestOnly'
      ? {monthly:principal*rate/1200,balance:principal,interest:principal*rate/1200*years*12,months:years*12}
      : F.period(principal,rate,val('sellerTerm'),years);
    const bank=F.period(price-bankDown,Math.min(100,val('bankRate')),val('bankTerm'),years);
    const sellerBroker=amount('sellerBroker',price),buyerBroker=amount('buyerBroker',price);
    const housing=(amount('tax',price)+amount('insurance',price))/12+val('hoa');
    function path(prefix,down,period){
      const buyerCosts=val(prefix+'BuyerCosts'),credit=Math.min(buyerCosts,val(prefix+'Credit'));
      const other=val(prefix+'Other'),buyerPaysBroker=$(prefix+'BrokerPayer').value==='buyer';
      const buyerCash=down+buyerCosts-credit+(buyerPaysBroker?buyerBroker:0);
      const sellerCash=(prefix==='seller'?down:price)-sellerBroker-other-credit-lien-(buyerPaysBroker?0:buyerBroker);
      return {down,period,buyerCosts,credit,other,buyerPaysBroker,buyerCash,sellerCash,
        monthly:period.monthly+housing+(prefix==='bank'?val('bankPmi'):0),
        financingCost:period.interest+buyerCosts-credit+(buyerPaysBroker?buyerBroker:0)+(prefix==='bank'?val('bankPmi')*period.months:0)};
    }
    return {price,years,lien,paymentType,sellerBroker,buyerBroker,seller:path('seller',sellerDown,seller),bank:path('bank',bankDown,bank)};
  }
  function signedMoney(n){return n<0?'−'+money(Math.abs(n)):money(n)}
  function render(){
    const x=scenario(),s=x.seller,b=x.bank,cashDifference=b.buyerCash-s.buyerCash,monthlyDifference=b.monthly-s.monthly,costDifference=b.financingCost-s.financingCost;
    put('sellerMonthly',money(s.monthly));put('bankMonthly',money(b.monthly));
    put('sellerBuyerCash',money(s.buyerCash));put('bankBuyerCash',money(b.buyerCash));
    put('sellerCash',signedMoney(s.sellerCash));put('bankCash',signedMoney(b.sellerCash));
    put('sellerPI',money(s.period.monthly));put('sellerInterest',money(s.period.interest));
    put('sellerBalance',money(s.period.balance));
    $('sellerTerm').disabled=x.paymentType==='interestOnly';
    put('sellerTermNote',x.paymentType==='interestOnly'?'Not used for interest-only payments.':'');
    put('sellerPaymentLabel',x.paymentType==='interestOnly'?'Interest received; principal due at payoff':'Principal + interest received');
    put('timelineClose',signedMoney(s.sellerCash));
    put('bankFinancingCost',money(b.financingCost));
    put('heroGap',money(Math.abs(cashDifference)));
    put('heroGapLabel',cashDifference>0?'less buyer cash needed at closing':cashDifference<0?'more buyer cash needed at closing':'difference in buyer cash at closing');
    put('heroInterest',money(s.period.interest));
    put('sellerCreditApplied',val('sellerCredit')>s.buyerCosts?'Applied '+money(s.credit)+'; limited to buyer closing costs.':'');
    put('bankCreditApplied',val('bankCredit')>b.buyerCosts?'Applied '+money(b.credit)+'; limited to buyer closing costs.':'');
    const yearText=x.years===1?'year 1':'year '+x.years;
    put('payoffText','In '+yearText+', the buyer would owe '+money(s.period.balance)+' in remaining principal. They may refinance into a traditional mortgage to pay it; approval and the future rate are not guaranteed. The balance remains due under the agreed terms.');
    let title,detail;
    if(cashDifference>0){title='A buyer could bring '+money(cashDifference)+' less to closing.'}
    else if(cashDifference<0){title='Seller financing asks this buyer for '+money(-cashDifference)+' more upfront.'}
    else title='Both paths ask for the same cash at closing.';
    if(costDifference>0)detail='Through '+yearText+', the buyer also pays '+money(costDifference)+' less in financing costs with seller financing.';
    else if(costDifference<0)detail='Through '+yearText+', the buyer pays '+money(-costDifference)+' more in financing costs with seller financing.';
    else detail='The buyer’s financing costs through '+yearText+' are the same.';
    detail+=' This compares interest, buyer-paid closing costs, buyer-paid broker compensation and entered mortgage insurance. Monthly housing costs appear separately above.';
    if(s.sellerCash<0)detail+=' The down payment does not cover the entered seller costs and loan payoff at closing; additional cash would be needed.';
    put('insightTitle',title);put('insightText',detail);
    put('monthlyGapLabel',monthlyDifference>=0?'Lower monthly cost with seller financing':'Higher monthly cost with seller financing');
    put('monthlyGap',money(Math.abs(monthlyDifference)));
    const summary='Sale '+money(x.price)+'; seller financing: buyer '+money(s.buyerCash)+' at closing, '+money(s.monthly)+'/month estimated housing cost, seller '+signedMoney(s.sellerCash)+' at closing, '+money(s.period.interest)+' interest through '+yearText+', '+money(s.period.balance)+' due at payoff. Conventional financing: buyer '+money(b.buyerCash)+' at closing, '+money(b.monthly)+'/month, seller '+signedMoney(b.sellerCash)+' at closing. Buyer refinance is not guaranteed. See full assumptions at sellterms.com.';
    $('emailSummary').href='mailto:?subject='+encodeURIComponent('Compare financing terms')+'&body='+encodeURIComponent(summary);
    $('textSummary').href='sms:?&body='+encodeURIComponent(summary);
  }
  function exportData(){
    const x=scenario(),s=x.seller,b=x.bank;
    return {brand:'sellterms.com',title:'A sale on your terms.',subtitle:money(x.price)+' sale price · '+x.years+' year payoff · '+(x.paymentType==='interestOnly'?'Interest only':'Principal + interest'),accent:'#0c4934',rows:[
      {label:'Buyer cash · seller financing',value:money(s.buyerCash)},
      {label:'Buyer cash · conventional',value:money(b.buyerCash)},
      {label:'Monthly housing · seller financing',value:money(s.monthly)},
      {label:'Monthly housing · conventional',value:money(b.monthly)},
      {label:'Your cash at closing · seller financing',value:signedMoney(s.sellerCash)},
      {label:'Your cash at closing · conventional',value:signedMoney(b.sellerCash)},
      {label:'Scheduled interest to you by payoff',value:money(s.period.interest)},
      {label:'Principal due at buyer payoff',value:money(s.period.balance)}
    ],footnote:'Rates: seller '+val('sellerRate')+'%, conventional '+val('bankRate')+'%. Down: '+money(s.down)+' / '+money(b.down)+'. Buyer may refinance at payoff; approval is not guaranteed. Estimates exclude servicing, collection, sale taxes and time value of money.'};
  }
  document.querySelectorAll('input,select').forEach(el=>el.addEventListener('input',render));
  document.querySelectorAll('[data-mode] button').forEach(button=>button.addEventListener('click',()=>{
    const id=button.closest('[data-mode]').dataset.mode,next=button.dataset.unit,old=modes[id];
    if(old===next)return;
    const base=val('price'),current=val(id);
    const converted=old==='percent'?base*current/100:(base?current/base*100:0);
    $(id).value=Number(converted.toFixed(next==='percent'?3:0));modes[id]=next;
    $(id+'Unit').textContent=id==='tax'||id==='insurance'?(next==='percent'?'% / year':'$ / year'):(next==='percent'?'%':'$');
    button.closest('[data-mode]').querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.unit===next)));
    render();
  }));
  $('downloadPdf').addEventListener('click',async()=>{try{await FinanceExport.pdf(exportData(),'sellterms-comparison');put('exportStatus','PDF downloaded.')}catch(e){put('exportStatus','Could not create PDF. Please try again.')}});
  $('shareGraphic').addEventListener('click',async()=>{try{await FinanceExport.share(exportData(),'sellterms-comparison',$('exportStatus'))}catch(e){put('exportStatus','Could not create graphic. Please try again.')}});
  if(document.modelContext?.registerTool){try{Promise.resolve(document.modelContext.registerTool({name:'configure_seller_terms',title:'Configure seller terms',description:'Set a sale price, seller rate and buyer payoff year and return the visible comparison.',inputSchema:{type:'object',properties:{salePrice:{type:'number',minimum:0,maximum:100000000},interestRate:{type:'number',minimum:0,maximum:100},refinanceYears:{type:'integer',minimum:1,maximum:10}},required:['salePrice','interestRate','refinanceYears'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute(input){if(!input||!Number.isFinite(input.salePrice)||input.salePrice<0||input.salePrice>100000000||!Number.isFinite(input.interestRate)||input.interestRate<0||input.interestRate>100||!Number.isInteger(input.refinanceYears)||input.refinanceYears<1||input.refinanceYears>10)throw new Error('Enter a valid sale price, rate and payoff year.');$('price').value=input.salePrice;$('sellerRate').value=input.interestRate;$('balloon').value=input.refinanceYears;render();return {sellerFinancingMonthly:$('sellerMonthly').textContent,conventionalMonthly:$('bankMonthly').textContent,sellerFinancingCashAtClosing:$('sellerCash').textContent,conventionalCashAtClosing:$('bankCash').textContent,comparison:$('insightTitle').textContent}}})).catch(()=>{})}catch(e){}}
  render();
})();
