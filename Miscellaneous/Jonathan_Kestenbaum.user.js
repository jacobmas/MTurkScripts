// ==UserScript==
// @name         Jonathan_Kestenbaum
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Get Job Title Location for Person
// @author       You
// @include        http://*.mturkcontent.com/*
// @include        https://*.mturkcontent.com/*
// @include        http://*.amazonaws.com/*
// @include        https://*.amazonaws.com/*
// @include https://worker.mturk.com/*
// @include file://*
// @grant  GM_getValue
// @grant GM_setValue
// @grant GM_addValueChangeListener
// @grant GM_setClipboard
// @grant GM_xmlhttpRequest
// @grant GM_openInTab
// @grant GM_getResourceText
// @grant GM_addStyle
// @connect google.com
// @connect bing.com
// @connect yellowpages.com
// @connect joesdata.com
// @connect *
// @require https://raw.githubusercontent.com/hassansin/parse-address/master/parse-address.min.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/js/MTurkScript.js
// @resource GlobalCSS https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/globalcss.css
// ==/UserScript==

(function() {
    'use strict';
    var my_query = {};
    var bad_urls=[];
    var MTurk=new MTurkScript(20000,200,[],begin_script,"A2G9YORBQD00MO",false);
    var MTP=MTurkScript.prototype;
    function is_bad_name(b_name,b_url)
    {
        b_name=b_name.replace(/\s+[\-\|]+.*$/,"");
        if(/spoke\.com/.test(b_url)) b_name=b_name.replace(/,.*$/,"").trim();
        var fullname=MTP.parse_name(b_name);
        console.log("in is_bad_name, b_name="+b_name);
        if(fullname.fname.toLowerCase().charAt(0)===my_query.first.toLowerCase().charAt(0) &&
           fullname.lname.toLowerCase().replace(/\'/g,"")===my_query.last.toLowerCase().replace(/\'/g,"")) return false;
        console.log("no match with "+my_query.first+", "+my_query.last+"|");
        return true;
    }

    function query_response(response,resolve,reject,site) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        var limit=10;
        if(site===undefined) site="";
        else limit=3;

        console.log("in query_response\n"+response.finalUrl+", site="+site);
        var search, b_algo, i=0, inner_a;
        var b_url="crunchbase.com", b_name, b_factrow,lgb_info, b_caption,p_caption,name_title,b_subModule_h2;
        name_title=new RegExp(my_query.name+",\\s*((?:Vice|President|Director|Senior)[^,]*)+");
        var b1_success=false, b_header_search,b_context,parsed_context,parsed_lgb,x,match,inner_li,j,split_exp;
        try
        {
            search=doc.getElementById("b_content");
            b_algo=search.getElementsByClassName("b_algo");
            lgb_info=doc.getElementById("lgb_info");
            b_context=doc.getElementById("b_context");
            console.log("b_algo.length="+b_algo.length);
	    if(b_context&&(parsed_context=MTP.parse_b_context(b_context))) {
                console.log("parsed_context="+JSON.stringify(parsed_context));
             var wpc_eif=b_context.querySelector("#wpc_eif");
            b_subModule_h2=b_context.querySelectorAll(".b_subModule h2");
             if(wpc_eif && wpc_eif.children.length>=2 && wpc_eif.innerText.indexOf(my_query.short_company)!==-1) {
        parsed_context["Job title"]=wpc_eif.children[0].innerText.replace(/;.*$/,"");
        parsed_context.Location=wpc_eif.children[wpc_eif.children.length-1].innerText; }

            for(i=0;i<b_subModule_h2.length; i++) {
                if(/Experience/.test(b_subModule_h2[i].innerText) && b_subModule_h2[i].nextElementSibling &&
                   (inner_li=b_subModule_h2[i].nextElementSibling.querySelector("li"))) {
                    split_exp=inner_li.innerText.split("\n");
                    if(!parsed_context["Job title"]) parsed_context["Job title"]=split_exp[0].trim();
                }
            }
            if(parsed_context.Current && !parsed_context["Job title"]) parsed_context["Job title"]=parsed_context.Current;
            if(parsed_context["Job title"]) parsed_context["Job title"]=parsed_context["Job title"].replace(/ (?:@|at|\||\-).*$/,"");
            if(parsed_context["Job title"]&&parsed_context.Location && site==="") {
                my_query.done.web=true;
                //for(x in my_query.done) my_query.done[x]=true;
                my_query.fields.Title=parsed_context["Job title"];
                my_query.fields.Location=parsed_context.Location;
                submit_if_done();
                return;
            }
        }
            if(lgb_info&&(parsed_lgb=MTP.parse_lgb_info(lgb_info))) {
                    console.log("parsed_lgb="+JSON.stringify(parsed_lgb)); }
            for(i=0; i < b_algo.length&&i<limit; i++) {
                b_name=b_algo[i].getElementsByTagName("a")[0].textContent;
                b_url=b_algo[i].getElementsByTagName("a")[0].href;
                b_caption=b_algo[i].getElementsByClassName("b_caption");
                b_factrow=b_algo[i].querySelector(".b_factrow");

                p_caption=(b_caption.length>0 && b_caption[0].getElementsByTagName("p").length>0) ?
                    p_caption=b_caption[0].getElementsByTagName("p")[0].innerText : '';
                console.log("("+i+"), b_name="+b_name+", b_url="+b_url+", p_caption="+p_caption);
                if(site==="") {
                    if(!is_bad_name(b_name,b_url) &&
                       b_factrow) scrape_facts(b_factrow,b_name,b_url,p_caption,i);
                   // if(/bloomberg\.com\/profiles\/people/.test(b_url)) scrape_bloomberg(b_name,b_url,p_caption);
                    if(/crunchbase\.com/.test(b_url)) scrape_crunchbase(b_name,b_url,p_caption);
                    if(/zoominfo\.com/.test(b_url)) scrape_zoominfo(b_name,b_url,p_caption);
                    //if(/spoke\.com/.test(b_url)) scrape_spoke(b_name,b_url,p_caption);
                    if(my_query.fields.Title.length===0 && ((match=b_name.match(name_title)))) my_query.fields.Title=match[1].trim();
                }

               if(site!=="" && !is_bad_name(b_name,b_url) && (b1_success=true)) break;
            }
            if(b1_success && (resolve(b_url)||true)) return;
        }
        catch(error) {
            reject(error);
            return;
        }
        if(site===""&&my_query.try_count===0) {
            my_query.try_count++;
            query_search("+\""+my_query.name+"\" "+my_query.company, resolve, reject, query_response);
            return;
        }
        resolve("");
        return;
    }
    function scrape_spoke(b_name,b_url,p_caption) {
    }


    function scrape_zoominfo(b_name,b_url,p_caption) {
        console.log("in scrape_zoominfo");
        var split=b_name.split(" | "),regex,match;
        var short_company;
        var regex4=new RegExp(my_query.name+"\\.\\s*([^\\.]+)");
                console.log("regex4="+regex4);

        if(my_query.fields.Title.length===0 && (match=p_caption.match(regex4))) my_query.fields.Title=match[1].trim();
        if(split.length<2 || is_bad_name(split[0].trim()) || !MTP.matches_names(my_query.short_company,MTP.shorten_company_name(split[1].trim()))) return;
        short_company=MTP.shorten_company_name(split[1].trim());
        console.log("in scrape_zoominfo2 "+JSON.stringify(split));
        regex=new RegExp(" as (.*) at "+short_company.trim());
        var regex2=new RegExp(" is(?: the)? (.*) (?:of|for) "+short_company.replace(/\s+.*$/,"").trim());
        var regex3=new RegExp(" based in ([^,]+ area),");

        if(my_query.fields.Title.length===0 && (match=p_caption.match(regex))||
          (match=p_caption.match(regex2)) && !/parent/i.test(match[1])&&!new RegExp(short_company.replace(/\s+.*$/,"")).test(match[1])) my_query.fields.Title=match[1].trim();
        else console.log("Title: match="+match);
        if(my_query.fields.Location.length===0 && (match=p_caption.match(regex3))) my_query.fields.Location=match[1].trim();

        else console.log("Location: match="+match);
    }

    function scrape_crunchbase(b_name,b_url,p_caption) {
        console.log("in scrape_crunchbase");
        var split=b_name.split(" - "),regex=/(.*) (?:at|@) /,match;
        if(split.length<2 || is_bad_name(split[0].trim())) return;
                console.log("in scrape_crunchbase2 "+JSON.stringify(split));

        if(my_query.fields.Title.length===0 && (match=split[1].match(regex))) my_query.fields.Title=match[1].trim();
        else console.log("match="+match);


    }

    function scrape_facts(b_factrow,b_name,b_url,p_caption,pos) {
        var li=b_factrow.querySelectorAll("li"),strong,i,value;
        var result={},split_name;
        for(i=0;i<li.length;i++) {
            if((strong=li[i].querySelector("strong"))) {
                result[strong.innerText.replace(/:.*$/,"")]=li[i].innerText.replace(strong.innerText,"").trim();
            }
        }

        if(result.Location) result.Location=fix_bing_location(result.Location);
        console.log("result="+JSON.stringify(result));
        var parsed=parseAddress.parseLocation(result.Location);
        if(/corporationwiki/.test(b_url) && result.Occupation && (my_query.fields.Title=result.Occupation)) return;
        if(/linkedin/.test(b_url) && !/linkedin\.com\/pub\//.test(b_url)) {
            var company_split=my_query.short_company.split(" ");
            var comp_regex=new RegExp(company_split[0]+(company_split.length>1?"|"+company_split[1]:"") ,"i");
            console.log("comp_regex="+comp_regex);
            if(pos>0 && !comp_regex.test(b_name)&&!comp_regex.test(p_caption)) return;
            split_name=b_name.split(" - ");
            if(my_query.fields.Title.length===0&& split_name.length>=2 && !/linkedin|undisclosed/i.test(split_name[1])) my_query.fields.Title=split_name[1].replace(/(\s+[a-z]+)*\s*(…|\.\.\.)\s*$/,"");
            else if(my_query.fields.Title.length===0&&result.Title) {
                my_query.fields.Title=result.Title.replace(/(\s+[a-z]+)*\s*…\s*$/,""); console.log("Set title from result"); }
            if(my_query.fields.Location.length===0&&result.Location) my_query.fields.Location=result.Location;
            console.log("Set in LInkedIn?");
            return;
        }
        if(parsed) console.log("parsed="+JSON.stringify(parsed));
        if(parsed&&parsed.city&&parsed.state && my_query.fields.Location.length===0) { my_query.fields.Location=parsed.city+", "+parsed.state; }



    }

    function fix_bing_location(location) {
        location=location.replace(/([\d]{5}),\s*([A-Z]{2})\s*$/,"$2 $1");
        return location;
    }


    /* Search on bing for search_str, parse bing response with callback */
    function query_search(search_str, resolve,reject, callback,site) {
        console.log("Searching with bing for "+search_str);
        var search_URIBing='https://www.bing.com/search?q='+
            encodeURIComponent(search_str)+"&first=1&rdr=1";
        GM_xmlhttpRequest({method: 'GET', url: search_URIBing,
                           onload: function(response) { callback(response, resolve, reject,site); },
                           onerror: function(response) { reject("Fail"); },ontimeout: function(response) { reject("Fail"); }
                          });
    }

    /* Following the finding the district stuff */
    function query_promise_then(result) {
        my_query.done.web=true;
                submit_if_done();

    }

    function joes_promise_then(result) {
        if(result.length===0) {
            my_query.done.joes=true;
            submit_if_done();
            return; }
        var promise=MTP.create_promise(result,parse_joesdata,parse_joesdata_then);
    }

    function parse_joesdata(doc,url,resolve,reject) {
        var person=doc.querySelector("[itemtype='http://schema.org/Person']");
        var result={success:true},name,names,company,location,title;
        if(!person) resolve({success:false});
         names=person.querySelectorAll("[itemprop='name']");
        name=names[0].innerText;
        company=names[1].innerText;
        location=person.querySelector("[itemprop='workLocation']").innerText;
        title=person.querySelector("[itemprop='jobTitle']").innerText;
        if(MTP.matches_names(MTP.shorten_company_name(my_query.company),MTP.shorten_company_name(company))) {
            Object.assign(result,{name:name,Title:title,Location:location,company:company});
            console.log("Here joesdata");
            resolve(result);
            return;
        }
        resolve({success:false});
    }
    function parse_joesdata_then(result) {
        my_query.done.joes=true;
        console.log("joesdata: "+JSON.stringify(result));

        var x;
        for(x in my_query.fields) {
            if(result.success && result[x]!==undefined && result[x].length>0) { my_query.fields[x]=result[x]; }
        }
        submit_if_done();
    }

    function corp_promise_then(result) {
        if(result.length===0) {
            my_query.done.corporationwiki=true;
            submit_if_done();
            return; }
        var promise=MTP.create_promise(result,parse_corporationwiki,parse_corporationwiki_then);
    }

    function parse_corporationwiki(doc,url,resolve,reject) {
        var person=doc.querySelector("[itemtype='http://schema.org/Person']");
        var result={success:true},name,names,company,location,title,title_loc,split_tl;
        if(!person) resolve({success:false});
         names=person.querySelectorAll("[itemprop='name']");
        name=names[0].innerText;
        company=names[1].innerText;
//        console.log("person.innerHTML="+person.innerHTML);
        location=person.querySelector("#header-location").innerText.replace(/,\s*/,", ").trim();
        title_loc=person.querySelector("[itemprop='jobTitle']").innerText;
        split_tl=title_loc.split(/ for /);
        if(split_tl.length>0) {
            title=split_tl[0];
            company=split_tl[1];
        }
        if(MTP.matches_names(MTP.shorten_company_name(my_query.company),MTP.shorten_company_name(company))) {
            Object.assign(result,{name:name,Title:title,Location:location,company:company});
            console.log("Here corporationwiki, setting");
            resolve(result);
            return;
        }
        resolve({success:false});
    }

    function parse_corporationwiki_then(result) {
        my_query.done.corporationwiki=true;
        console.log("corporationwiki: "+JSON.stringify(result));

        var x;
        for(x in my_query.fields) {
            if(my_query.fields.length===0 && result.success && result[x]!==undefined && result[x].length>0) { my_query.fields[x]=result[x]; }
        }
        submit_if_done();
    }
    function zoom_promise_then(result) {
        if(result.length===0) {
            my_query.done.zoom=true;
            submit_if_done();
            return; }
        var promise=MTP.create_promise(result,parse_zoom,parse_zoom_then);
    }
    function parse_zoom(doc,url,resolve,reject) {
        console.log("in parse_zoom,url="+url);
        //console.log("doc.body.innerHTML="+doc.body.innerHTML);
        var result={success:true},name,names,company,location,title,title_loc,split_tl,row;
        var i,label,info,parsed;
        title=doc.querySelector(".personMain_basicInfo-occupation-title")?doc.querySelector(".personMain_basicInfo-occupation-title").innerText:"";
        try {
            name=doc.querySelector(".fn").innerText;
            row=doc.querySelectorAll(".primeSection_details-row");
            for(i=0;i<row.length;i++) {
                label=row[i].querySelector(".primeSection_details-label").innerText.replace(/:.*$/,"").trim();
                info=row[i].querySelector(".primeSection_details-info").innerText;
                result[label]=info;
            }
            parsed=parseAddress.parseLocation(result.Location);
            if(parsed&&parsed.city&&parsed.state) result.Location=parsed.city+", "+parsed.state;
            else result.Location="";
            console.log("zoominfo before, result="+JSON.stringify(result));

            if(MTP.matches_names(MTP.shorten_company_name(my_query.company),MTP.shorten_company_name(result.Company))) {
                Object.assign(result,{name:name,Title:title,});
                console.log("Here zoominfo, setting "+JSON.stringify(result));
                resolve(result);
                return;
            }
        }
        catch(error) { console.log("Error in zoominfo "+error); }
        resolve({success:false});
    }

    function parse_zoom_then(result) {
        my_query.done.zoom=true;
        console.log("zoom: "+JSON.stringify(result));

        var x;
        for(x in my_query.fields) {
            if(result.success && result[x]!==undefined && result[x].length>0) { my_query.fields[x]=result[x]; }
        }
        submit_if_done();
    }
    function spoke_promise_then(result) {
        if(result.length===0) {
            my_query.done.spoke=true;
            submit_if_done();
            return; }
        var promise=MTP.create_promise(result,parse_spoke,parse_spoke_then);
    }
    function parse_spoke(doc,url,resolve,reject) {
        console.log("parse_spoke,url="+url);
        var result={success:true},name,names,company,location,title,title_loc,split_tl,row;
        var person=doc.querySelector("[itemtype='http://schema.org/Person']");
        if(!person) resolve({success:false});
        names=person.querySelectorAll("[itemprop='name']");
        name=names[0].innerText;
        try {
            company=person.querySelector("[itemprop='worksFor']").innerText;


            try {
                location=person.querySelector("[itemprop='addressLocality']").innerText+", "+person.querySelector("[itemprop='addressRegion']").innerText;;
            }
            catch(error) { console.log("error in parse_spoke with location "+error); }
            title=person.querySelector("[itemprop='jobTitle']").innerText;
            if(MTP.matches_names(MTP.shorten_company_name(my_query.company),MTP.shorten_company_name(company))) {
                Object.assign(result,{name:name,Title:title,Location:location,company:company});
                console.log("Here spoke,result="+JSON.stringify(result));
                resolve(result);
                return;
            }
        }
        catch(error) { console.log("error in parse_spoke with worksfor or something "+error); }
        resolve({success:false});
    }

    function parse_spoke_then(result) {
        my_query.done.spoke=true;
        console.log("spoke: "+JSON.stringify(result));
        var x;
        for(x in my_query.fields) {
            if(result.success && result[x]!==undefined && result[x].length>0) { my_query.fields[x]=result[x]; }
        }
        submit_if_done();
    }

    function mylife_promise_then(result) {
        console.log("mylife_promise_then "+result);
        if(result.length===0) {
            my_query.done.mylife=true;
            submit_if_done();
            return; }
        console.log("MOOO BOOM");
        var promise=MTP.create_promise(result,parse_mylife,parse_mylife_then);
    }
    function parse_mylife(doc,url,resolve,reject) {
        console.log("parse_mylife,url="+url);
        var result={success:true},name,names,company,location,title,title_loc,split_tl,row;
        var jsonscript=doc.querySelector("script[type='application/ld+json']"),parsed_json;
        try {
            parsed_json=JSON.parse(jsonscript.innerHTML.trim());
            if(MTP.matches_names(MTP.shorten_company_name(my_query.company),MTP.shorten_company_name(parsed_json.about.worksFor))) {
                Object.assign(result,{name:parsed_json.about.name,Title:parsed_json.about.jobTitle,
                                      Location:parsed_json.about.address.addressLocality+", "+parsed_json.about.address.addressRegion,
                                      company:parsed_json.about.worksFor});
                console.log("Here mylife,result="+JSON.stringify(result));
                resolve(result);
                return;
            }
        }
        catch(error) { console.log("error in parse_mylife "+error); }
        resolve({success:false});
    }

    function parse_mylife_then(result) {
        my_query.done.mylife=true;
                console.log("mylife: "+JSON.stringify(result));

        var x;
        for(x in my_query.fields) {
            if(result.success && result[x]!==undefined && result[x].length>0) { my_query.fields[x]=result[x]; }
        }
        submit_if_done();
    }



    function begin_script(timeout,total_time,callback) {
        if(timeout===undefined) timeout=200;
        if(total_time===undefined) total_time=0; 
        if(callback===undefined) callback=init_Query;
        if(MTurk!==undefined) { callback(); }
        else if(total_time<2000) {
            console.log("total_time="+total_time);
            total_time+=timeout;
            setTimeout(function() { begin_script(timeout,total_time,callback); },timeout);
            return;
        }
        else { console.log("Failed to begin script"); }
    }

    function add_to_sheet() {
        var x,field;
        my_query.fields.Title=my_query.fields.Title.replace(new RegExp(" (at|of|for) "+my_query.short_company.replace(/\s+.*$/,"")+".*$","i"),"")
        .replace(/ (?:@|at|\||\-).*$/,"");
        for(x in my_query.fields) if(field=document.getElementsByName(x)[0]) field.value=my_query.fields[x].trim();
    }

    function submit_if_done() {
        console.log("in submit_if_done: "+JSON.stringify(my_query.done));
        var is_done=true,x,done_dones;
        add_to_sheet();
        for(x in my_query.done) if(!my_query.done[x]) is_done=false;
        done_dones=is_done;
        for(x in my_query.fields) if(my_query.fields[x].length===0) is_done=false;
        console.log("done_dones="+done_dones+", is_done="+is_done);

        if(is_done && !my_query.submitted && (my_query.submitted=true)) MTurk.check_and_submit();
        else if(!is_done && !my_query.submitted && done_dones) {
            console.log("Returning");
            setTimeout(function() {
            GM_setValue("returnHit",true); }, 2000);
        }
    }

    function parse_company_page(doc,url,resolve,reject) {
        console.log("In parse_company_page");
        var title=doc.title.replace(/^(Welcome|Home|Homepage)\s*(,|\s[\|\-]{1}|\s)\s*/,"");
        resolve(title.replace(/(,|\s+([\|\-]{1})).*$/,"").trim());
    }
    function parse_page_then(result) {
        my_query.company=result;
        my_query.short_company=MTP.shorten_company_name(my_query.company);
        console.log("Found name="+result);
        begin_query_stuff();
    }



    function init_Query() {
        console.log("in init_query");
        var i,match;
        var wT=document.getElementById("DataCollection").getElementsByTagName("table")[0];
        my_query={first:wT.rows[0].cells[1].innerText.trim(),last:wT.rows[1].cells[1].innerText.replace(/,/g,"").trim(),
                  company:wT.rows[2].cells[1].innerText.replace("rÃ©","e").trim(),
                  fields:{Title:"",Location:""},done:{web:false,joes:false,corporationwiki:false,zoom:false,spoke:false,mylife:false},
                  submitted:false,try_count:0};
        if((match=my_query.last.match(/\(([^\)]+)\)/))) { my_query.middle=match[1];
                                                        my_query.last=my_query.last.replace(/\(([^\)]+)\)/,"").trim(); }
        if((match=my_query.last.match(/^([A-Z]\.)\s*/))) { my_query.middle=match[1];
                                                        my_query.last=my_query.last.replace(/^([A-Z]\.)\s*/,"").trim(); }
        if((!/^(Van|Von|De) /.test(my_query.last))) my_query.last=my_query.last.replace(/^[A-Za-z]+\s+/,"");
        my_query.name=my_query.first+" "+my_query.last;
       // my_query.company=my_query.company.replace(/\.com$/,"");
        my_query.short_company=MTP.shorten_company_name(my_query.company);

        if(my_query.first===my_query.last) {
            my_query.fields.Title="Not a person";
            my_query.fields.Location="Not a person";
            add_to_sheet();
            MTurk.check_and_submit();
            return;
        }
	console.log("my_query="+JSON.stringify(my_query));

        if(/\.(org|com|net)/.test(my_query.company)) {
            let url="http://www."+my_query.company;
            console.log("Trying url="+url);
            var promise=MTP.create_promise(url,parse_company_page,parse_page_then,begin_query_stuff);
        }
        else begin_query_stuff();
    }
    function begin_query_stuff() {

        var search_str=my_query.name+" "+my_query.short_company;
      const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(search_str, resolve, reject, query_response);
        });
        queryPromise.then(query_promise_then)
            .catch(function(val) {

            console.log("Failed at this queryPromise " + val); GM_setValue("returnHit",true); });
       const joesPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
           search_str=my_query.name+" "+MTP.shorten_company_name(my_query.company)+" site:joesdata.com";
            query_search(search_str, resolve, reject, query_response,"joesdata.com");
        });
        joesPromise.then(joes_promise_then)
            .catch(function(val) {
            console.log("Failed at this joesPromise " + val); my_query.done.joes=true; submit_if_done();  });
        const corpPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
           search_str=my_query.name+" "+MTP.shorten_company_name(my_query.company)+" site:corporationwiki.com";
            query_search(search_str, resolve, reject, query_response,"corporationwiki.com");
        });
        corpPromise.then(corp_promise_then)
            .catch(function(val) {
            console.log("Failed at this joesPromise " + val); my_query.done.corporationwiki=true; submit_if_done();  });

        const zoomPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
           search_str=my_query.name+" "+MTP.shorten_company_name(my_query.company)+" site:zoominfo.com";
            query_search(search_str, resolve, reject, query_response,"zoominfo.com");
        });
        zoomPromise.then(zoom_promise_then)
            .catch(function(val) {
            console.log("Failed at this zoomPromise " + val); my_query.done.zoom=true; submit_if_done();  });
        const spokePromise = new Promise((resolve, reject) => {

           search_str=my_query.name+" "+MTP.shorten_company_name(my_query.company)+" site:spoke.com";
             console.log("Beginning URL search for spoke with "+search_str);
            query_search(search_str, resolve, reject, query_response,"spoke.com");
        });
        spokePromise.then(spoke_promise_then)
            .catch(function(val) {
            console.log("Failed at this spokePromise " + val); my_query.done.spoke=true; submit_if_done();  });
        const mylifePromise = new Promise((resolve, reject) => {

           search_str=my_query.name+" "+MTP.shorten_company_name(my_query.company)+" site:mylife.com";
             console.log("Beginning URL search for spoke with "+search_str);
            query_search(search_str, resolve, reject, query_response,"mylife.com");
        });
        mylifePromise.then(mylife_promise_then)
            .catch(function(val) {
            console.log("Failed at this mylifePromise " + val); my_query.done.mylife=true; submit_if_done();  });

    }

})();