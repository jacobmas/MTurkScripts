/**
 * File with various useful common (mostly aggregator type) site parsers, still relatively informal 
 * Contains special parsers which search Buzzfile and Manta directly by opening new tabs
 */
var AggParser={}; // generic object

function proper_casing(match,p1,p2) {
        return p1+p2.toLowerCase(); }

function Person(curr,nameSource,emailDomain,quality) {
	var name,title,email,phone;
	name=curr.name;
	title=curr.title;
	email=curr.email;
	phone=curr.phone;
	if(name&&typeof(name)==="object" &&
	   name.first && name.last) Object.assign(this,{first:name.first,middle:"",last:name.last});
	else if(name&&typeof(name)==="string") {
		let fullname=MTP.parse_name(name);
		Object.assign(this,{first:fullname.fname,middle:fullname.mname,last:fullname.lname}); }
	this.first=this.first?this.first.replace(/^([A-Z]{1})([A-Z]+)$/,proper_casing):"";
	this.last=this.last?this.last.replace(/^([A-Z]{1})([A-Z]+)$/,proper_casing):"";

	this.title=title||"";
	this.nameSource=nameSource||"";
	this.phone=phone||"";
	this.email=email||"";
	this.emailDomain=emailDomain||"";
	this.emailSource=curr.emailSource||"";
	this.quality=0;
	if(quality) this.quality=quality;
	//if(/buzzfile\.com/.test(nameSource)) this.quality+=4;
	
	Object.assign({email:"",emailSource:""});
        
}

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
AggParser.parse_bbb=function(doc,url,resolve,reject) {
	console.log("In parse_bbb,url="+url);
	var script=doc.querySelectorAll("script"),i,split_text,fullname;
	var regex=/\s*window\.__PRELOADED_STATE__\s*\=\s*(.*);\s*$/,match,parsed,x;
	for(i=0;i<script.length;i++) {
		if((match=script[i].innerHTML.match(regex))) {
		   // console.log("script["+i+"].innerHTML="+script[i].innerHTML);
			parsed=JSON.parse(match[1]);
			AggParser.parse_bbb_inner(doc,url,resolve,reject,parsed);
			return;
		}
	}
};
AggParser.parse_bbb_inner=function(doc,url,resolve,reject,parsed) {
	var i;
	var result=[];
	console.log(parsed);
	var contacts=parsed.businessProfile.contactInformation.contacts;
	for(i=0;i<contacts.length;i++) {
		console.log("contacts["+i+"]="+JSON.stringify(contacts[i]));
		if(contacts[i].name.first===null && contacts[i].name.last!==null) {
			let fullname=MTP.parse_name(contacts[i].name.last);
			if(fullname&&fullname.fname&&fullname.lname) {
				contacts[i].name.first=fullname.fname;
				contacts[i].name.last=fullname.lname;
			}
			else continue;
		}

		result.push(new Person({name:{first:contacts[i].name.first.replace(/\s.*$/,""),last:contacts[i].name.last},title:contacts[i].title,email:""},url,""));
		console.log(result);
	}
	console.log(result);
	resolve(result);
	return;
}


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
    //console.log("parse_buzzfile, result="+JSON.stringify(result));
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
        var add=doc.querySelector("[itemprop='address']");
        if(add) {
            let streetAdd=add.querySelector("[itemprop='streetaddress']")?add.querySelector("[itemprop='streetaddress']").innerText:"";
            let city=add.querySelector("[itemprop='addresslocality']")?add.querySelector("[itemprop='addresslocality']").innerText:"";
            let state=add.querySelector("[itemprop='addressregion']")?add.querySelector("[itemprop='addressregion']").innerText:"";
            let zip=add.querySelector("[itemprop='postalcode']")?add.querySelector("[itemprop='postalcode']").innerText:"";
            if(streetAdd&&city&&state&&zip) {
                            result.address=new Address(streetAdd+","+city+", "+state+" "+zip);

                console.log("result.address=",result.address);
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

AggParser.parse_dnb=function(doc,url,resolve,reject) {
	var result={url:url,employee_list:[],industry_links:[]};
	var temp_name=doc.querySelector("[name='company_name'] span");
	if(temp_name) result.name=temp_name.innerText.trim();
	var span=doc.querySelector("[name='employees_all_site'] span");
	var address,phone,website,name,temp,title;
	var span_list=['address','phone','name'],x;
	if(!span) span=doc.querySelector("[name='employees_this_site'] span");
	if((address=doc.querySelector("[name='company_address'] span"))) {
		result.address=new Address(address.innerText.replace(/United States\s*$/,"").trim());
	}
	for(x of span_list) {
		if((temp=doc.querySelector(`[name='company_${x}'] span`))) {
			result[x]=temp.innerText.trim();
		}
	}
	if((temp=doc.querySelector(`[name='revenue_in_us_dollar'] span`))) {
		result.revenue=temp.innerText.trim();
	}
	if((temp=doc.querySelector("[name='company_website'] a"))) {
		result.website=temp.href;
	}
	var ind_links=doc.querySelectorAll('[name="industry_links"] > span > span');
	for(x of ind_links) {
		result.industry_links.push(x.innerText.trim());
	}


	var people=doc.querySelectorAll("[itemtype='https://schema.org/Person']");
	for(x of people) {
		name=x.querySelector("[itemprop='name']");
		title=x.querySelector("[itemprop='jobTitle']");
		result.employee_list.push({name:name?name.innerText.trim():"",title:title?title.innerText.trim():""});

	}

	if(span) result.employees=span.innerText.trim();


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

 AggParser.is_bad_linked_url = function(url) {
        if(/plus\.google\.com|paypal\.me|twitch\.tv|((youtube|gofundme|discord|vk|spotify|patreon|tiktok|roblox|snapchat)\.com)/.test(url)) return true;
        if(/linkin\.bio|\.apple\.com/.test(url)) return true;
        return false;
    }


/* parse_youtube_inner is a helper function for the parse_youtube function */
AggParser.parse_youtube_inner=function(text) {
	var parsed,ret={},runs,match,x,content,contents,i,tabs,label,links,url;
	var subscribers,match1,match2;
	try { parsed=JSON.parse(text); }
	catch(error) { console.log("error parsing="+error+", text="+text); return; }
	for(x in parsed) {
		//   console.log("x="+x);

		if(/subscriber/.test(JSON.stringify(parsed[x]))) console.log("found subscriber");
	}
	console.log("parsed=",parsed);
 //   console.log("header=",parsed.header);
	try {

		subscribers=parsed.header.c4TabbedHeaderRenderer.subscriberCountText.simpleText.replace(/\s.*$/,"").trim().replace(/^[^\d]*/,"");
		//   console.log("subscribers=",subscribers);
		match1=subscribers.match(/([\d\.]+)([a-zA-Z]*)/);
		//  console.log(match1);
		if(match1) {
			let temp1=parseFloat(match1[1]);
			if(match1[2]==='K') temp1*=1000;
			if(match1[2]==='M') temp1*=1000000;
			ret.subscribers=temp1;
		}
	}
	catch(e) { console.warn("Error parsing subscribers"); }
   // console.log("contents=",parsed.contents);
	if(!parsed.contents) {
		ret.email='none@none.none';
		return ret;
	}
	tabs=parsed.contents.twoColumnBrowseResultsRenderer.tabs;
	for(i=0; i < tabs.length; i++) if(tabs[i].tabRenderer && tabs[i].tabRenderer.title==="About" && (content=tabs[i].tabRenderer.content)) break;
	if(!content) return ret;
	contents=content.sectionListRenderer.contents[0].itemSectionRenderer.contents[0].channelAboutFullMetadataRenderer;
	if((label=contents.businessEmailLabel)===undefined) ret.email="";
	if(contents.subscriberCountText && (runs=contents.subscriberCountText.runs) && runs.length>0 &&
	   runs[0].text) ret.total_subscribers=runs[0].text.replace(/,/g,"");
	if(contents.country && contents.country.simpleText) ret.location=contents.country.simpleText;
	if((links=contents.primaryLinks)===undefined) links=[];
	if(contents.title) ret.name=contents.title.simpleText;
	for(i=0; i < links.length; i++) {
		url=decodeURIComponent(links[i].navigationEndpoint.urlEndpoint.url.replace(/^.*(&|\?)q\=/,"")).replace(/(&|\?).*$/,"");
		console.log("url["+i+"]="+url);
		if(/instagram\.com/.test(url)) ret.insta=url;
		else if(/facebook\.com/.test(url)) ret.fb=url.replace(/\/$/,"").replace(/facebook\.com\//,"facebook.com/pg/")+"/about";
		else if(/twitter\.com/.test(url)) ret.twitter=url;
		else if(/plus\.google\.com/.test(url)) ret.googleplus=url;
		else if(!AggParser.is_bad_linked_url(url) && i<=1) {
			ret.url=url;
			if(/^www/.test(ret.url)) ret.url="https://"+ret.url;
			if(!/^http/.test(ret.url)) ret.url="https://www."+ret.url;
		}
		if(!/http/.test(url) && /@/.test(url)) ret.email=url;
	}
	if(contents.description && contents.description.simpleText && (ret.description=contents.description.simpleText.replace(/\\n/g,"\n"))) {
		if(match=ret.description.match(email_re)) ret.email=match[0];
		if(!ret.insta && (match=ret.description.match(/https:\/\/(www.)?instagram.com\/[A-Za-z\.0-9_\-\/]+/))) ret.insta=match[0];
		if(ret.insta && /^www/.test(ret.insta)) ret.insta="https://"+ret.insta;
		if(!ret.fb && (match=ret.description.match(/https?:\/\/([a-z]+).facebook.com\/[A-Za-z\.0-9_\-\/]+/))) ret.fb=match[0];
	}
	return ret;
};
/* parse_youtube Parses the 'about' page of a youtube channel */
AggParser.parse_youtube=function(doc,url,resolve,reject) {
	var scripts=doc.scripts,i,script_regex_begin=/^\s*var ytInitialData \=\s*/,text;
	var script_regex_end=/\s*window\[\"ytInitialPlayerResponse\".*$/,ret={success:false},x,promise_list=[];
	var email_match,match;
	for(i=0; i < scripts.length; i++) {
	   // console.log("scripts[i]=",scripts[i].innerHTML);
		if(script_regex_begin.test(scripts[i].innerHTML)) {
			text=scripts[i].innerHTML.replace(script_regex_begin,"");

			if(text.indexOf(";")!==-1) text=text.substr(0,text.indexOf("};")+1);
			ret=AggParser.parse_youtube_inner(text);
			console.log("ret=",ret);
			resolve(ret);
			return;
		}
	}
	resolve(ret);
};


/* do_bloomberg_snapshot parses
 * https://www.bloomberg.com/research/stocks/private/snapshot.asp?privcapId=[\d+] pages
 * doc the document to use to parse it, to allow use for either xmlhttprequest or open in
 *       new window
 */
AggParser.parseext_bloomberg_snapshot=function(doc) {
    console.log("Doing bloomberg ");

    var result={"phone":"","country":"",url:"","name":"","state":"","city":"","streetAddress":"","postalCode":""};
   
    var address=doc.querySelector("[itemprop='address']");
    var phone=doc.querySelector("[itemprop='telephone']");
    var name=doc.querySelector("[itemprop='name']");
    var url=doc.querySelector("[itemprop='url']");
    var executives=doc.querySelectorAll("[itemprop='member']");
    var add_match, add_regex=/^([^,]+)(?:,\s*(.*?))?\s*((?:[A-Z]*[\d]+[A-Z\d]+[A-Z]*))$/;

    if(phone!==null && phone!==undefined) result.phone=phone.innerText;

    if(address!==null && address!==undefined)
    {
        var add_split=address.innerText.split("\n");
        var add_len=add_split.length;
        var curr_pos=add_len-1,i;

        while(curr_pos>=0 && add_split[curr_pos].length<2) curr_pos--;
        console.log("add_len="+add_len);
        if(curr_pos>=0) {
            result.country=add_split[curr_pos]; }
        curr_pos--;
        while(curr_pos>=0 && add_split[curr_pos].length<2) curr_pos--;
        if(curr_pos>=0) {
            add_match=add_split[curr_pos].match(add_regex);
            console.log("add_match="+JSON.stringify(add_match));
            if(add_match)
            {
                result.city=add_match[1];
                result.state=add_match[2];
                result.postalCode=add_match[3];
            }

        }

        result.streetAddress="";
        for(i=0; i < curr_pos; i++)
        {
            if(add_split[i].length<2) continue;
            result.streetAddress=result.streetAddress+add_split[i];
            if(i<curr_pos-1) result.streetAddress=result.streetAddress+",";
        }
        result.streetAddress=result.streetAddress.replace(/,$/,"");
    }
    if(url!==undefined && url!==null) { result.url=url.href; }
    if(name!==undefined && name!==null) { result.name=name.innerText; }
    console.log("this="+this.prototype);
    result.name=MTurkScript.prototype.shorten_company_name(result.name);
    console.log("result="+JSON.stringify(result));
    console.log("Setting bloom_result");
    GM_setValue("bloomberg.com/research/stocks/private/snapshot.asp"+"_result",result);
    return;

}

AggParser.parseext_bloomberg_profile=function(doc,url,resolve,reject,response)
{
    var result={"phone":"","country":"",url:"","name":"","state":"","city":"","streetAddress":"","postalCode":"",
                sector:"","industry":"","sub_industry":"",executives:[],description:""};
    var i;
    var address=document.getElementsByClassName("address");
    var phone=doc.querySelector("[itemprop='telephone']");
    var name=doc.querySelector("[itemprop='name']");
    var url=document.getElementsByClassName("website");
    var executives=document.getElementsByClassName("executive");
    var desc=document.getElementsByClassName("description");
    var fields=["sector","industry","sub_industry"];
    var add_match, add_regex=/^([^,]+)(?:,\s*(.*?))?\s*((?:[A-Z]*[\d]+[A-Z\d]+[A-Z]*))$/;
    if(desc.length>0) result.description=desc[0].innerText;
    for(i=0; i < fields.length; i++)
    {
        let curr_field=document.getElementsByClassName(fields[i]);
        if(curr_field.length>0) result[fields[i]]=curr_field[0].innerText.replace(/^[^:]+:\s*/,"");
    }
    for(i=0; i < executives.length; i++)
    {
        try
        {
            result.executives.push({name:executives[i].getElementsByClassName("name")[0].innerText,
                                    position:executives[i].getElementsByClassName("position")[0].innerText});
        }
        catch(error) { console.log("error pushing "+error); }
    }
    if(url.length>0 && url[0].getElementsByTagName("a").length>0) { result.url=url[0].getElementsByTagName("a")[0].href; }
    if(name!==undefined && name!==null) { result.name=name.content; }
    if(phone!==null && phone!==undefined) result.phone=phone.content;
    if(address.length>0)
    {
        var add_split=address[0].innerText.split("\n");
        let curr_pos=add_split.length-1;
        if(curr_pos>0) result.country=add_split[curr_pos--].trim();
        if(curr_pos>=0) {
            add_match=add_split[curr_pos].match(add_regex);
            console.log("add_match="+JSON.stringify(add_match));
            if(add_match)
            {
                result.city=add_match[1];
                result.state=add_match[2];
                result.postalCode=add_match[3];
            }

        }
        for(i=0; i < curr_pos; i++)
        {
            if(add_split[i].length<2) continue;
            result.streetAddress=result.streetAddress+add_split[i];
            if(i<curr_pos-1) result.streetAddress=result.streetAddress+",";
        }


    }
    console.log("result="+JSON.stringify(result));
    console.log("Setting bloom_result");
    GM_setValue("bloomberg.com/profiles/companies/"+"_result",result);
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

/** 
 * TODO: Yelp doesn't grab stuff for non-restaurants now
 */

AggParser.parse_yelp_inner=function(parsed) {
    console.log("in parse_yelp_inner");
    function decodeHtml(html) {
        var txt = document.createElement("textarea");
        txt.innerHTML = html;
        return txt.value;
    }
    var ret={},y;
    var details=parsed.bizDetailsPageProps,x;
    var contact=details.bizContactInfoProps;
    ret.name=details.businessName;
    if(details.bizHoursProps) ret.hours=details.bizHoursProps.hoursInfoRows;
    if(details.fromTheBusinessProps) ret.fromBusiness=details.fromTheBusinessProps.fromTheBusinessContentProps;
    ret.businessInfoItems={};
    if(details.moreBusinessInfoProps&&details.moreBusinessInfoProps.businessInfoItems) {
        for(x of details.moreBusinessInfoProps.businessInfoItems) {
            ret.businessInfoItems[x.title]=decodeHtml(x.label);
        }
    }

    if(contact) {
        if(contact.businessWebsite && contact.businessWebsite.href) {
            ret.website=decodeURIComponent(contact.businessWebsite.href.replace("/biz_redir?url=",""))
		.replace(/\&.*$/,""); }
        ret.phone=contact.phoneNumber;
    }

    if(details.mapBoxProps && details.mapBoxProps.addressLines) {
        ret.address="";
        for(y of details.mapBoxProps.addressLines) ret.address=ret.address+(ret.address.length>0?",":"")+y;
    }

    return ret;
};

AggParser.parse_yelp=function(doc,url,resolve,reject) {
    /* Only parses restaurants properly at present, use other previous work to parse other things */
    var result={},is_parsed=false;
    var yelp_re=/^\s*\<\!\-\-\s*(.*)\s*\-\-\>s*$/;
    var yelp_match,curr_script,parsed;
    AggParser.parse_yelp_noscript(doc,url,result);
   
    resolve(result);
};

AggParser.parse_yelp_time_replacer=function(match, p1, p2, p3, offset, string) {
        // p1 is nondigits, p2 digits, and p3 non-alphanumerics
        var time12=parseInt(p1);
        if(p3.toLowerCase()==="pm" && time12!==12) time12=time12+12;
        else if(p3==="am" && time12==="12") time12=0;
        var hrstr="";
        if(time12<10) hrstr="0";
        hrstr=hrstr+time12;
        return hrstr+":"+p2;
};


AggParser.fix_yelp_time=function(to_fix)
{
    return to_fix.replace(/(\d+):(\d+) ([A-Za-z][A-Za-z])/,AggParser.parse_yelp_time_replacer);
};

AggParser.parse_yelp_noscript=function(doc,url,result) {
    var i;
    Object.assign(result,{closed:[],openTime:[],closeTime:[],
			  cleanOpenTime:[],cleanCloseTime:[],categories:"",bizinfo:"",city:"",state:""});
    var weekday, hours;
    var street_add=doc.getElementsByClassName("map-box-address");
    var day_map={"Sun": 0, "Mon": 1, "Tue": 2, "Wed": 3, "Thu": 4, "Fri": 5, "Sat": 6};
    var biz_header=doc.getElementsByClassName("biz-page-header");
    var ywidget=doc.getElementsByClassName("ywidget");
    if(street_add.length>0) {
        var real_address=street_add[0].getElementsByTagName("address")[0].innerText;
        if(real_address.indexOf("\n")===-1) real_address="Fake Street\n"+real_address;
        real_address=real_address.replace(/\n/,",");
        real_address=real_address.replace(",Ft ",",Fort ").replace(" Bch "," Beach ").replace( "Ft "," Fort ");
        var new_add=parseAddress.parseLocation(real_address);
        console.log("new_add="+JSON.stringify(new_add));
        Object.assign(result,{city:new_add.city,state:new_add.state});
        
    } 
    else  console.log("No street add found");
    for(i=0; i < 7; i++) {
        result.closed.push(false);
        result.openTime.push("");
	result.cleanOpenTime.push("");
        result.closeTime.push("");
	result.cleanCloseTime.push("");
    }
    var hours_t=doc.getElementsByClassName("hours-table");
    if(hours_t.length>0) {
        for(i=0; i < hours_t[0].rows.length; i++) {
            weekday=hours_t[0].rows[i].cells[0].innerText;
            hours=hours_t[0].rows[i].cells[1].innerText;
            if(hours.indexOf("Closed")!==-1) result.closed[day_map[weekday]]=true;
            if(hours.indexOf("Open 24")!==-1)
            {
                result.openTime[day_map[weekday]]="12:00 am";
                result.closeTime[day_map[weekday]]="11:59 pm";
            }
            else if(hours.indexOf("-")!==-1)
            {
                var the_spans=hours_t[0].rows[i].cells[1].getElementsByTagName("span");
                result.openTime[day_map[weekday]]=AggParser.fix_yelp_time(the_spans[0].innerText);
		result.cleanOpenTime[day_map[weekday]]=the_spans[0].innerText.trim();
                result.closeTime[day_map[weekday]]=AggParser.fix_yelp_time(the_spans[1].innerText);
		result.cleanCloseTime[day_map[weekday]]=the_spans[1].innerText.trim();

            }
            else  console.log("Error parsing time");
        }
    }
    else console.log("Can't find hours table");
    if(biz_header.length>0) {
        var cat_str=biz_header[0].getElementsByClassName("category-str-list");
        if(cat_str.length>0) result.categories=cat_str[0].innerText;
    }
    for(i=0; i < ywidget.length; i++) {
        var h3=ywidget[i].getElementsByTagName("h3");
        if(h3.length>0 && h3[0].innerText.indexOf("More business info")!==-1) {
            var ylist=ywidget[i].getElementsByClassName("ylist");
            if(ylist.length>0) result.bizinfo=ylist[0].innerText;
        }
    }
    console.log("result="+JSON.stringify(result));
};

/* Doesn't seem to work, seems to use IP :( */
if(/\.yelp\.com/.test(window.location.href)) {
    AggParser.remove_yelp_cookies();
}

AggParser.remove_yelp_cookies=function() {
    console.log("monstering up some cookies");
    var x;
    for(x of docCookies.keys()) {
        GM.cookie.delete({name:x},function(error) {
            console.log(error||'success'); });
    }
    setTimeout(AggParser.remove_yelp_cookies,5000);
};

