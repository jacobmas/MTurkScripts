/* File with various useful site parsers, still relatively informal */
var AggParser={}; // generic object


AggParser.parse_postal_elem=function(elem,priority,site,url) {
    var ret={},text;
    var term_map={"streetaddress":"address1","addressLocality":"city","addressRegion":"state","postalCode":"postcode","addressCountry":"country"};
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
    return new Address(ret,priority,url);
};

/* Parse a PostalAddress schema */
AggParser.parse_postal=function(doc,url,resolve,reject,type) {
    console.log("in parse_"+type+", url="+url);
    var div=doc.querySelector("[itemtype='https://schema.org/PostalAddress']");
    var result={success:true,site:type,fields:{}};
    if(!div) { resolve({success:false,site:type}); return; }
    result.address=AggParser.parse_postal_elem(div,4,type,url);
    console.log("parse_postal, result="+JSON.stringify(result));
    resolve(result);
};

/* TODO: finish */
AggParser.parse_bbb=function(query,resolve,reject) {
    console.log("In parse_bbb,url="+url);
    var script=doc.querySelectorAll("script"),i,split_text,fullname;
    var regex=/\s*window\.__PRELOADED_STATE__\s*\=\s*(.*);\s*$/,match,parsed,x;
    for(i=0;i<script.length;i++) {
        if((match=script[i].innerHTML.match(regex))) {
            // console.log("script["+i+"].innerHTML="+script[i].innerHTML);
            parsed=JSON.parse(match[1]);
            parse_bbb_inner(doc,url,resolve,reject,parsed);
            resolve(parsed);
        }
    }
};

AggParser.parse_buzzfile=function(doc,url,resolve,reject,quality) {
    console.log("in parse_buzzfile, url="+url);
    var div=doc.querySelector("[itemtype='https://schema.org/PostalAddress']");
    var divorg=doc.querySelector("[itemtype='https://schema.org/Organization']"),employee,title;    
    var result={success:true,site:"buzzfile",quality:quality,fields:{}};
    var headers=doc.querySelectorAll(".company-info-header"),content=doc.querySelectorAll(".company-info-content"),i;
    var sector_table=doc.querySelectorAll(".company-info-box table"),curr_row;
    if(sector_table.length>=2) {
	for(curr_row of sector_table[1].rows) {
	    if(curr_row.cells.length>=2) {
		result[curr_row.cells[0].innerText.replace(/:\s*$/,"").trim()]=curr_row.cells[1].innerText.trim();
	    }
	}
    }
    for(i=0;i<content.length;i++) {
	let curr_header=content[i].previousElementSibling;
	result[curr_header.innerText.replace(/:\s*$/,"").trim()]=content[i].innerText.trim(); }
    if(!div && !divorg && (resolve({success:false,site:"buzzfile"})||true)) return;
    if(div) result.address=AggParser.parse_postal_elem(div,4,result.site,url);
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
};


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
            result.address=AggParser.parse_postal_elem(nextItem,4,"bizapedia",url);
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
			   websiteURL:state.website||"N/A",revenue:state.revenue||"N/A",
			   employees:state.employeeCount||"N/A",
			   sic:state.sicCode?(array_to_str(state.sicCode)||"N/A"):"N/A",
			   street:state.street1Address||"N/A",
			   city:state.city||"N/A",state:state.state||"N/A",
			   zip:state.zipcode||"N/A",phone:state.phoneNumber||"N/A"});
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

/**
 * parse_insta_script is a helper for parse_instagram that extracts the useful data
 */
AggParser.parse_insta_script=function(parsed)
    {
        var x,y,z;
        var user=parsed.entry_data.ProfilePage[0].graphql.user;
        var result={success:true,followers:"",following:"",name:"",
                    username:"",url:"",is_business:false,email:"",phone:"",
                   category:"",address:{},biography:""};
        if(user.edge_followed_by!==undefined &&
           user.edge_followed_by.count!==undefined) result.followers=user.edge_followed_by.count;
         if(user.edge_follow!==undefined &&
           user.edge_follow.count!==undefined) result.following=user.edge_follow.count;
        if(user.full_name!==undefined) result.name=user.full_name;
        if(user.username!==undefined) result.username=user.username;
        if(user.external_url!==undefined) result.url=user.external_url;
        if(user.is_business_account!==undefined) result.is_business=user.is_business_account;
        if(user.business_email) result.email=user.business_email;
	if(user.profile_pic_url) result.profile_pic_url=user.profile_pic_url;
        if(user.business_address_json)
        {
            let temp_add=JSON.parse(user.business_address_json);
            result.address={addressLine1:temp_add.street_address, city:temp_add.city_name.replace(/,.*$/,""),
                            state:temp_add.region_name, country:"",country_code:temp_add.country_code};
            if(result.address.state.length===0) result.address.state=temp_add.city_name.replace(/^[^,]*,\s*/,"");
        }
        if(user.biography) result.biography=user.biography;
        if(user.business_phone_number) result.phone=user.business_phone_number;
        return result;
    }

/** parser for instagram to read the data */
AggParser.parse_instagram=function(doc,url,resolve,reject) {
    var scripts=doc.scripts,i,j,parsed,script_regex=/^window\._sharedData\s*\=\s*/;
    var result={success:false};
    for(i=0; i < scripts.length; i++) {
        if(script_regex.test(scripts[i].innerHTML))  {
            parsed=JSON.parse(scripts[i].innerHTML.replace(script_regex,"").replace(/;$/,""));
	    try {
		result=AggParser.parse_insta_script(parsed);
	    }
	    catch(error) { console.log("Error in parse_insta_script"+error); }
            resolve(result);
            break;
        }
    }
    resolve(result);
    return;
};


/* parse_ta_hours is a helper function for parse_trip_advisor */
AggParser.parse_ta_hours=function(hrs) {
    console.log("parse_ta_hours: hrs="+JSON.stringify(hrs));
    var day_list=["Sat","Sun","Mon","Tue","Wed","Thu","Fri"],i,j,day_match,hrs_match,ret={};
    for(i=0; i < hrs.length; i++) {
        if(!/ - /.test(hrs[i].days)) hrs[i].days=hrs[i].days+" - "+hrs[i].days;
        if(!(day_match=hrs[i].days.match(/^([A-Za-z]{3}) - ([A-Za-z]{3})/))) continue;
        for(j=day_list.indexOf(day_match[1]); j<=day_list.indexOf(day_match[2]); j++) {
            ret[day_list[j]]=hrs[i].times; }
    }
    return ret;
};
    /* Parses trip_advisor for some useful info like hours */
AggParser.parse_trip_advisor=function(doc,url,resolve,reject) {
    var scripts=doc.scripts,i,ret={},context=null,x,responses=null;
    var context_regex=/^\{\"@context/,m_reg=/^define\(\'@ta\/page-manifest\',\[\],function\(\)\{return /;
    console.log("in parse_trip_advisor, url="+url+", scripts.length="+scripts.length);
    for(i=0; i < scripts.length; i++) {
        if(!context && context_regex.test(scripts[i].innerHTML) &&
           (context=JSON.parse(scripts[i].innerHTML))) ret.address=context.address;
        else if(m_reg.test(scripts[i].innerHTML) &&
                (responses=JSON.parse(scripts[i].innerHTML.replace(m_reg,"").replace(/;\}\);$/,""))
                 .redux.api.responses)) {
            for(x in responses) {
                if(/\/about\//.test(x)) {
                    ret.categories=responses[x].data.taxonomyInfos.map(x => x.name);
                    //ret.taxonomyInfos=responses[x].data.taxonomyInfos;
                    if(responses[x].data.displayHours) {
                        ret.hours=AggParser.parse_ta_hours(responses[x].data.displayHours); }
                }
            }
        }
    }
    resolve(ret);
};


/** TODO: add query conditions, edit if to be less selective, maybe grab more than one */
AggParser.parse_yellowpages=function(doc,url,resolve,reject) {
    var mdm=doc.querySelectorAll(".search-results .mdm"),i,result={success:true},cats,new_url;
    for(i=0;i<mdm.length;i++) {
        var name=mdm[i].querySelector(".business-name"),addr=mdm[i].querySelector(".adr"),parsed_add,phone;
        phone=mdm[i].querySelector(".phone");
        if(addr&&(result.address=addr.innerText) &&
	   (result.parsed_add=parseAddress.parseLocation(addr.innerText)) && name && (result.name=name.innerText)) {
            result.phone=phone?phone.innerText:"";
            if(cats=mdm[i].querySelector(".categories")) result.categories=cats.innerText;
            if(new_url=mdm[i].querySelector(".track-visit-website")) result.url=new_url.href;
            resolve(result);
            return;
        }
    }
    console.log("No yellowpages results");
    result.success=false;
    resolve(result);
    return;
};

/* parse_youtube_inner is a helper function for the parse_youtube function */
AggParser.parse_youtube_inner=function(text) {
    var parsed,ret={},runs,match,x,content,contents,i,tabs,label,links,url;
    try { parsed=JSON.parse(text); }
    catch(error) { console.log("error parsing="+error+", text="+text); return; }
    tabs=parsed.contents.twoColumnBrowseResultsRenderer.tabs;
    for(i=0; i < tabs.length; i++) if(tabs[i].tabRenderer && tabs[i].tabRenderer.title==="About" && (content=tabs[i].tabRenderer.content)) break;
    if(!content) return ret;
    contents=content.sectionListRenderer.contents[0].itemSectionRenderer.contents[0].channelAboutFullMetadataRenderer;
    if((label=contents.businessEmailLabel)===undefined) ret.email="";
    if(contents.subscriberCountText && (runs=contents.subscriberCountText.runs) && runs.length>0 &&
       runs[0].text) ret.total_subscribers=runs[0].text.replace(/,/g,"");
    if(contents.country && contents.country.simpleText) ret.location=contents.country.simpleText;
    if((links=contents.primaryLinks)===undefined) links=[];
    for(i=0; i < links.length; i++) {
        url=decodeURIComponent(links[i].navigationEndpoint.urlEndpoint.url.replace(/^.*(&|\?)q\=/,"")).replace(/(&|\?).*$/,"");
        console.log("url["+i+"]="+url);
        if(/instagram\.com/.test(url)) ret.insta=url; 
        else if(/facebook\.com/.test(url)) ret.fb=url.replace(/\/$/,"").replace(/facebook\.com\//,"facebook.com/pg/")+"/about"; 
        else if(/twitter\.com/.test(url)) ret.twitter=url;
        else if(!/plus\.google\.com|((youtube|gofundme|patreon)\.com)/.test(url) && i===0) ret.url=url;
    }
    if(contents.description && contents.description.simpleText && (ret.description=contents.description.simpleText.replace(/\\n/g,"\n"))) {
        if(match=ret.description.match(email_re)) ret.email=match[0];
        if(!ret.insta && (match=ret.description.match(/https:\/\/(www.)?instagram.com\/[A-Za-z\.0-9_\-\/]+/))) ret.insta=match[0];
        if(!ret.fb && (match=ret.description.match(/https?:\/\/([a-z]+).facebook.com\/[A-Za-z\.0-9_\-\/]+/))) ret.fb=match[0];
    }
    return ret;
};
/* parse_youtube Parses the 'about' page of a youtube channel */
AggParser.parse_youtube=function(doc,url,resolve,reject) {
    var scripts=doc.scripts,i,script_regex_begin=/^\s*window\[\"ytInitialData\"\] \=\s*/,text;
    var script_regex_end=/\s*window\[\"ytInitialPlayerResponse\".*$/,ret={success:false},x,promise_list=[];
    var email_match,match;
    for(i=0; i < scripts.length; i++) {
        if(script_regex_begin.test(scripts[i].innerHTML)) {
            text=scripts[i].innerHTML.replace(script_regex_begin,"");
            if(text.indexOf(";")!==-1) text=text.substr(0,text.indexOf("};")+1);
            resolve(AggParser.parse_youtube_inner(text));
            return;
        }
    }
    resolve(ret);
};


/** 
 * Parser for manta.com, happening live to avoid distil getting around
 * can deal with finding coords later if aI care  
 */

AggParser.do_manta_search=function(name,location,resolve,reject) {
      //  MTurk.check_and_submit();
        var the_manta;
        
        the_manta=new MyManta(name,resolve,reject,location);
        var x;
        for(x in the_manta) console.log("x="+x);
        GM_setValue("manta_instance",the_manta);
        GM_setValue("manta_state","begin");
        console.log("the_manta="+JSON.stringify(the_manta));
        var the_tab=GM_openInTab(the_manta.search_url);
        GM_addValueChangeListener("manta_state",function() {
            console.log("manta_state change, arguments="+JSON.stringify(arguments));
            var new_val=arguments[2];
            if(new_val==="done") {
                the_manta=GM_getValue("manta_instance",{});
                the_tab.close();
                resolve(the_manta);
            }
	    else if(new_val==="fail") {
		    the_manta=GM_getValue("manta_instance",{});
                the_tab.close();
                reject(the_manta);
	    }
        });
};

function MyManta(name,resolve,reject,location,status) {
    var x;
    if(typeof name ==="object") {
        for(x in name) {
            this[x]=name[x]; }
    }
    else {
        this.name=name;
        this.resolve=resolve;
        this.reject=reject;
        this.status=status;
        this.lat=location?location.lat:"";
        this.lon=location?location.lon:"";
        this.search_url="https://www.manta.com/search?search_source=nav&search="+encodeURIComponent(this.name);
        if(this.lat&&this.lon) this.search_url=this.search_url+"&pt="+(this.lat&&this.lon?encodeURIComponent(this.lat+","+this.lon):"");
    }
    // this.init();

}
MyManta.prototype.init=function() {
    console.log("Calling init"); };
MyManta.prototype.parse_manta_search=function() {
    var i,j,list_items,entity,item;
    console.log("In parse_manta_search, name="+this.name);
    var the_div=document.querySelector("[itemprop='isPartOf']");
    list_items=document.querySelectorAll("ul[rel='searchResults'] .list-group-item");
    var itemprop_list=["name","streetAddress","addressLocality","addressRegion","postalCode"];
    var entity_data,temp;
    for(entity of list_items) {
        entity_data={};
        for(item of itemprop_list) {
            if((temp=entity.querySelector("[itemprop='"+item+"']"))) entity_data[item]=temp.innerText.trim(); }
        if((temp=entity.querySelector("[itemprop='url']"))) entity_data.url=temp.content;
        console.log("entity_data="+JSON.stringify(entity_data));
        if(entity_data.name && entity_data.url&& (MTurkScript.prototype.matches_names(this.name,entity_data.name)||
                                                  MTurkScript.prototype.matches_names(MTurkScript.prototype.shorten_company_name(this.name),
                                                                                      MTurkScript.prototype.shorten_company_name(entity_data.name)))) {
            console.log("Success with finding it, going to "+entity_data.url);
            this.manta_url=entity_data.url;
            GM_setValue("manta_instance",this);
            GM_setValue("manta_state","parse");
            window.location.href=this.manta_url;
            return;
        }
    }

    GM_setValue("manta_state","fail");
};
MyManta.prototype.parse_manta=function(response) {
    var script_re=/^\s*\{\"@context/;
    var script_lst=document.scripts,curr_script,parsed;
    for(curr_script of script_lst) {
        if(script_re.test(curr_script.innerHTML)) {
            try {
                parsed=JSON.parse(curr_script.innerHTML);
                this.schema=parsed;
                GM_setValue("manta_instance",this);
                GM_setValue("manta_state","done");
                return;
            }
            catch(error) {
                console.log("error parsing script JSON");
            }
        }
    }

};


/* Basic code to always run */
if(/\.manta.com(\/|$)/.test(window.location.href)) {
    var temp_manta=GM_getValue("manta_instance");
    var state=GM_getValue("manta_state");
    var the_manta;
    console.log("the_manta="+JSON.stringify(the_manta)+", the_manta="+the_manta);
    
    if(state==="begin") {
        GM_setValue("manta_state","search");
        the_manta=new MyManta(temp_manta.name,temp_manta.resolve,temp_manta.reject,temp_manta.location,"search");
        console.log("Going to do parse_manta_search");
        the_manta.parse_manta_search();
    }
    else if(state==="parse") {
        the_manta=new MyManta(temp_manta);
        console.log("Going to do parse_manta");
        the_manta.parse_manta();
    }
}




function Buzzfile(name,address,resolve,reject) {
    var x;
    if(typeof name==='object') {
        for(x in name) this[x]=name[x]; }
    else {
        this.name=name;
        this.address=address;
        if(!this.address) this.address={"city":"","state":""};
        this.resolve=resolve;
        this.reject=reject;
        this.search_url="https://buzzfile.com/Search/Company/Results?searchTerm="+encodeURIComponent(this.name.replace(/\s/g,"-"));
    }
}
Buzzfile.prototype.parse_buzzfile_search=function() {
    console.log("In buzzfile search");
    var table=document.querySelector("table#companyList"),i,curr_row,comp={};
    
    for(i=1;i<table.rows.length;i++) {
        curr_row=table.rows[i];
        if(curr_row.cells.length<=5) continue;
	//            console.log("curr_row.cells.length="+curr_row.cells.length);
        Object.assign(comp,{name:curr_row.cells[1].innerText.trim(),city:curr_row.cells[4].innerText.trim(),state:curr_row.cells[5].innerText.trim()});
        if(comp.name&& (MTurkScript.prototype.matches_names(this.name,comp.name)||
                        MTurkScript.prototype.matches_names(MTurkScript.prototype.shorten_company_name(this.name),
                                                            MTurkScript.prototype.shorten_company_name(comp.name)))&&
           (!this.address||!this.address.state||this.address.state===comp.state||state_map[this.address.state]===comp.state)) {
            this.buzzfile_url=document.querySelector("table#companyList td a").href;
            GM_setValue("buzzfile_instance",this);
            console.log("this="+JSON.stringify(this));
            GM_setValue("buzzfile_state","done");
	    return;
        }
    }
    this.failed=true;
    GM_setValue("buzzfile_instance",this);
    console.log("FAILED, this="+JSON.stringify(this));
    GM_setValue("buzzfile_state","done");    
}

AggParser.do_buzzfile_search=function(name,address,resolve,reject) {
    var the_tab;
    var the_buzzfile=new Buzzfile(name,address,resolve,reject);
    GM_setValue("buzzfile_instance",the_buzzfile);
    GM_setValue("buzzfile_state","begin");
    GM_addValueChangeListener("buzzfile_state",function() {
        console.log("buzzfile_state change, arguments="+JSON.stringify(arguments));
        var new_val=arguments[2];
        if(new_val==="done") {
            the_buzzfile=GM_getValue("buzzfile_instance",{});
            console.log("Done, the_buzzfile="+JSON.stringify(the_buzzfile));
            the_tab.close();
            console.log("closed the tab");
	    if(the_buzzfile.failed) {
		reject(the_buzzfile);
	    }
	    else {
		resolve(the_buzzfile);
	    }
            return;
        }
    });
    the_tab=GM_openInTab(the_buzzfile.search_url);
    
}

if(/\.buzzfile.com(\/|$)/.test(window.location.href)) {
    var temp_buzzfile=GM_getValue("buzzfile_instance");
    var state=GM_getValue("buzzfile_state","begin");
    var the_buzzfile;
    if(state==="begin") {
        unsafeWindow.localStorage.clear();
        the_buzzfile=new Buzzfile(temp_buzzfile);
        the_buzzfile.parse_buzzfile_search();
    }
    
}
