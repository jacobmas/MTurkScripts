var AggParser={};
AggParser.parse_buzzfile=function(doc,url,resolve,reject,quality) {
    console.log("in parse_buzzfile, url="+url);
    var div=doc.querySelector("[itemtype='https://schema.org/PostalAddress']");
    var result={success:true,site:"buzzfile",quality:quality,fields:{}};
    if(!div && (resolve({success:false,site:"buzzfile"})||true)) return; 
    result.address=AggParser.parse_postal_elem(div,4);
    console.log("parse_buzzfile, result="+JSON.stringify(result));
    resolve(result);
};

AggParser.parse_hotfrog=function(doc,url,resolve,reject,quality) {
    console.log("in parse_hotfrog, url="+url);
    AggParser.parse_postal(doc,url,resolve,reject,"hotfrog");
}

AggParser.parse_postal_elem=function(elem,priority,site) {
    var ret={},text;
    var term_map={"streetaddress":"address1","addressLocality":"city","addressRegion":"state","postalCode":"zip","addressCountry":"country"};
    var curr_item,x;
    for(x in term_map) {
        console.log("term_map["+x+"]="+term_map[x]+"[itemprop='"+x+"'] i");
        if(curr_item=elem.querySelector("[itemprop='"+x+"' i]")) {
            console.log("curr_item.innerText.trim()="+curr_item.innerText.trim());
            ret[term_map[x]]=curr_item.innerText.trim().replace(/\n/g,",").trim(); }
    }
    if(/,/.test(ret.address1)) {
        ret.address2=ret.address1.replace(/^[^,]+,/,"");
        ret.address1=ret.address1.replace(/,.*$/,"");
    }    
    return new Address(ret,priority);
};

AggParser.parse_postal=function(doc,url,resolve,reject,type) {
    console.log("in parse_"+type+", url="+url);
    var div=doc.querySelector("[itemtype='https://schema.org/PostalAddress']");
    var result={success:true,site:type,fields:{}};
    if(!div) { resolve({success:false,site:type}); return; }
    result.address=AggParser.parse_postal_elem(div,4,type);
    console.log("parse_postal, result="+JSON.stringify(result));
    resolve(result);
}

AggParser.parse_bizapedia=function(doc,url,resolve,reject) {
    console.log("in parse_bizapedia, url="+url);
    var biz=doc.querySelector("[itemtype='https://schema.org/LocalBusiness']");
    var result={success:true,site:"bizapedia",fields:{}};
    if((!biz) && (resolve(result)||true)) return;
    var td=biz.querySelectorAll("td"),i,nextItem,x;
    for(i=0;i<td.length;i++) {
        if(/^(Principal|Mailing)/.test(td[i].innerText)) {
            console.log("### Found principal address");
            nextItem=td[i].parentNode.querySelectorAll("td")[1];
            result.address=AggParser.parse_postal_elem(nextItem,4,"bizapedia");
            break;
        }
    }
    resolve(result);

};
AggParser.parse_infofree=function(doc,url,resolve,reject) {
    console.log("In parse_infofree, url="+url);
    var add=doc.querySelector(".content .row div h4");
    var result={success:true,site:"infofree",fields:{}};
    if((!add) && (resolve(result)||true)) return;
    result.address=new Address(add.innerText.replace(/\n/g,","),4);
    resolve(result);

};

AggParser.parse_chamber=function(doc,url,resolve,reject,quality) {
    console.log("in parse_chamber, url="+url);
    var result={success:true,site:"chamberofcommerce",quality:quality},i,span;
    var tel=doc.querySelector("[itemprop='telephone']");
    var first=doc.querySelector(".mainContactFirstName"),last=doc.querySelector(".mainContactLastName");
    var title=doc.querySelector(".mainContactTitle");
    if(first&&last&&title) {
        result.name=first.innerText+" "+last.innerText;
        result.title=title.innerText;
    }

    if(tel) result.phone=tel.innerText;
    resolve(result);
}

AggParser.parse_dandb=function(doc,url,resolve,reject,quality) {
    console.log("in parse_dandb, url="+url);
    var tel=doc.querySelector(".tel");
    var result={success:true,site:"dandb",quality:quality},i,span;
    if(tel) result.phone=tel.innerText.trim();
    var bus_lst=doc.querySelectorAll(".business li");
    for(i=0;i<bus_lst.length;i++) {
        if(/Contacts/.test(bus_lst[i].innerText) && (span=bus_lst[i].querySelector("span"))) {
            result.name=span.innerText.trim();
            result.title="Owner"; }
    }
    console.log("parse_dandb, result="+JSON.stringify(result));
    resolve(result);
};
