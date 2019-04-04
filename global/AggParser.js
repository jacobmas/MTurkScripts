// File with various useful site parsers 
var AggParser={};
AggParser.parse_buzzfile=function(doc,url,resolve,reject,quality) {
    console.log("in parse_buzzfile, url="+url);
    var div=doc.querySelector("[itemtype='https://schema.org/PostalAddress']");
    var divorg=doc.querySelector("[itemtype='https://schema.org/Organization']"),employee,title;
    
    var result={success:true,site:"buzzfile",quality:quality,fields:{}};
    if(!div && !divorg && (resolve({success:false,site:"buzzfile"})||true)) return;
    if(div) {
	result.address=AggParser.parse_postal_elem(div,4);
    }
    if(divorg && (employee=divorg.querySelector("[itemprop='employee']")) &&
       (title=divorg.querySelector("[itemprop='contactType']"))) {
	Object.assign(result,{name:employee.innerText.trim(),title:title.innerText.trim()});
    }
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

AggParser.parse_whitepages=function(doc,url,resolve,reject) {
    var h2=doc.querySelector(".module-title h2");
    var street=doc.querySelector(".address-primary");
    var line2=doc.querySelector(".address-location");
    var tel=doc.querySelector(".tel");
    var result={company:"",address1:"",city:"",state:"",zip:""};
    var line2_rx=/^(.*) ([A-Z]{2}) ([\d\-]+)$/,match;
    if(h2 && !/^Owner Details$/.test(h2.innerText.trim())) result.company=h2.innerText.trim();
    if(tel) result.phone=tel.innerText.trim();
    if(street) result.address1=street.innerText.trim();
    if(line2&&(match=line2.innerText.trim().match(line2_rx))) {
        result.city=match[1].replace(/,\s*$/,"").trim();
        my_query.state=match[2].trim();
        my_query.zip=match[3].trim();
    }
    else if(line2) { console.log("** line2.innerText.trim()="+line2.innerText.trim()); }
    resolve(result);
};

/* Parser for npidb.org doctor stuff */
AggParser.parse_npidb=function(doc,url,resolve,reject) {
    console.log("parse_npidb, url="+url);
    var physDiv=doc.querySelector("[itemtype='http://schema.org/Physician']"),x,curr,text;
    var result={"success":true,type:"npidb"},term_map={"name":"name","address":"address","telephone":"phone","faxNumber":"fax"};
    if(!physDiv && (resolve({success:false})||true)) return;
    for(x in term_map) {
        if((curr=doc.querySelector("[itemprop='"+x+"']"))&&
           (text=curr.innerText.trim())&&text.length>0) result[term_map[x]]=text.replace(/\n+/g,",");
    }
    resolve(result);
};
/* Parser for npiprofile.org doctor stuff */
AggParser.parse_npiprofile=function(doc,url,resolve,reject) {
    console.log("parse_npiprofile, url="+url);
    var the_div=doc.querySelector("#npi-addresses");
    var match;
    var result={success:true,type:"npiprofile"};
    if(the_div && (match=the_div.innerText.match(/(?:(?:P:)|Phone\s*(?:[:]{1}?))\s*([\d\-\(\)\.\s]+)/i))) {
        result.phone=match[1].replace(/[\.\s]+$/g,"");        
    }
    if(the_div && (match=the_div.innerText.match(/(?:(?:F:)|Fax\s*(?:[:]{1}?))\s*([\d\-\(\)\.\s]+)/i))) {
        result.fax=match[1].replace(/[\.\s]+$/g,"");
    }
    resolve(result);
};
/* Parser for providerdata.org doctor stuff */
AggParser.parse_providerdata=function(doc,url,resolve,reject) {
    console.log("parse_providerdata, url="+url);
    var fax=doc.querySelector(".contactFax");
    var result={"success":true,type:"providerdata"};
    if(fax) {
        result.fax=fax.innerText.replace(/^\s*Fax\s*:\s*/,"").trim();
        console.log("* Found fax="+my_query.fields.fax+" in parse_providerdata");
    }
    resolve(result);
};

/* For a script to run on owler.com in window to enable continued scraping without having to dig through distil again */
AggParser.reload_for_owler=function() {
    var try_count_fails=GM_getValue("try_count_fails",0);
    if(/owler\.com/.test(window.location.href)) {
        var time=20000;
        GM_addValueChangeListener("try_count_fails",function() {
            try_count_fails=arguments[2];
            console.log("Need to reload owler ");
            window.location.reload(true); });
        console.log("Setting reload for "+time);
        //setTimeout(function() { window.location.reload(true) },time);
        return;
    }
};

AggParser.array_to_str=function(arr) {
    var ret="",i;
    for(i=0;i<arr.length;i++) ret+=(i>0?",":"")+arr[i];
    return ret;
};

AggParser.parse_owler_json=function(text) {
    var parsed,state,x,counter=1,i,ret={success:true};
    try {
        parsed=JSON.parse(text);
        state=parsed.props.pageProps.initialState;
        console.log(JSON.stringify(state));
	Object.assign(ret,{companyName:state.companyName||"N/A",Description:state.description||"N/A",
		      websiteURL:state.website||"N/A",revenue:state.revenue||"N/A",employees:state.employeeCount||"N/A",
		      sic:state.sicCode?(array_to_str(state.sicCode)||"N/A"):"N/A",street:state.street1Address||"N/A",
		      city:state.city||"N/A",state:state.state||"N/A",zip:state.zipcode||"N/A",phone:state.phoneNumber||"N/A"});
        if(state.sicCode) console.log("state.sicCode="+JSON.stringify(state.sicCode));
        for(x in state.competitorDetails) ret["competitor"+(counter++)]=state.competitorDetails[x].name;
        for(i=counter;i<=10;i++) ret["competitor"+i]="N/A";
        return ret;
    }
    catch(error) { console.log("Error parsing json "+error); }
    return {success:false};
};
AggParser.parse_owler=function(doc,url,resolve,reject,term_map) {
    var ret={found_script:false};
    var scripts=doc.scripts,regex=/__NEXT_DATA__ \=\s*([^\n]+)/,match,i;
    for(i=0;i<scripts.length;i++) {
        if(match=scripts[i].innerHTML.match(regex) && (ret.found_script=true)) {
            console.log("Matched regex at "+i);
            Object.assign(ret,parse_owler_json(match[1]));
            break;
        }
    }
    resolve(ret);
};
