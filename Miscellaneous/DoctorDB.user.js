// ==UserScript==
// @name         DoctorDB
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  New script
// @author       You
// @include        http://*.mturkcontent.com/*
// @include        https://*.mturkcontent.com/*
// @include        http://*.amazonaws.com/*
// @include        https://*.amazonaws.com/*
// @include https://worker.mturk.com/*
// @include file://*
// @grant  GM_getValue
// @grant GM_setValue
// @grant GM_deleteValue
// @grant GM_addValueChangeListener
// @grant GM_setClipboard
// @grant GM_xmlhttpRequest
// @grant GM_openInTab
// @grant GM_getResourceText
// @grant GM_addStyle
// @connect google.com
// @connect bing.com
// @connect yellowpages.com
// @connect *
// @require https://raw.githubusercontent.com/hassansin/parse-address/master/parse-address.min.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/js/MTurkScript.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/Govt/Government.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/cacadbd55536aeccfae3d3760e2c302e4c333f9c/global/Address.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/AggParser.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/Email/MailTester.js
// @require https://raw.githubusercontent.com/spencermountain/compromise/master/builds/compromise.min.js
// @resource GlobalCSS https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/globalcss.css
// ==/UserScript==

(function() {
    'use strict';
    var my_query = {};
    var bad_urls=['.healthgrades.com','.vitals.com','.medicarelist.com','.healthcare4ppl.com','.yelp.com','.zocdoc.com',
                 '.npidb.com','/npino.com','.ehealthscores.com','/npiprofile.com','/healthprovidersdata.com','.usnews.com','.doximity.com',
                 '.linkedin.com','.sharecare.com','.caredash.com','.healthcare6.com','.topnpi.com','.md.com','.yellowpages.com','.mapquest.com',
                 '.hipaaspace.com','.spokeo.com','/npidb.com','.webmd.com','.whitepages.com','.bizapedia.com','.facebook.com',".myheritage.com",
                 '.beenverified.com','.peoplefinders.com','.doctorhelps.com','.instantcheckmate.com','.wikipedia.org','/npidb.org','.vitadox.com',
                 '.medicinenet.com','//doctor.com',"www.primarycare-doctor.com","findatopdoc.com",".doctor.com","lawtally.com","providers.hrt.org",
                 ".healthpage.org"];
    var MTurk=new MTurkScript(20000,500,[],begin_script,"A1BOHRKGTWLMTJ",true);
    var MTP=MTurkScript.prototype;
    function is_bad_name(b_name)
    {
        return false;
    }

    function query_response(response,resolve,reject,type) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        console.log("in query_response\n"+response.finalUrl+", type=",type);
        var search, b_algo, i=0, inner_a;
        var b_url="crunchbase.com", b_name, b_factrow,lgb_info, b_caption,p_caption;
        var b1_success=false, b_header_search,b_context,parsed_context,parsed_lgb;
        try
        {
            search=doc.getElementById("b_content");
            b_algo=search.getElementsByClassName("b_algo");
            lgb_info=doc.getElementById("lgb_info");
            b_context=doc.getElementById("b_context");
            console.log("b_algo.length="+b_algo.length);
	    if(b_context&&(parsed_context=MTP.parse_b_context(b_context))) {
                console.log("parsed_context="+JSON.stringify(parsed_context));
            if(parsed_context.url) {
                resolve(parsed_context.url);
                return;
            }
            else if(parsed_context.people&&parsed_context.people.length>0 && parsed_context.people[0].url!==undefined) {
            }
        }
            if(lgb_info&&(parsed_lgb=MTP.parse_lgb_info(lgb_info))) {
                    console.log("parsed_lgb="+JSON.stringify(parsed_lgb)); }
            for(i=0; i < b_algo.length&&i<5; i++) {
                if(type==='webmdquery' && i>=3) break;
                b_name=b_algo[i].getElementsByTagName("a")[0].textContent;
                b_url=b_algo[i].getElementsByTagName("a")[0].href;
                b_caption=b_algo[i].getElementsByClassName("b_caption");
                p_caption=(b_caption.length>0 && b_caption[0].getElementsByTagName("p").length>0) ?
                    p_caption=b_caption[0].getElementsByTagName("p")[0].innerText : '';
                console.log("("+i+"), b_name="+b_name+", b_url="+b_url+", p_caption="+p_caption);
                if(type==="healthgrades" && !MTP.is_bad_name(my_query.name.replace(/M\.?D\.?/,"").trim(),b_name.replace(/[,\|].*$/,"").replace(/Dr\./,"").replace(/,?\s*MD/,""))
                   && new RegExp(my_query.parsed_name.lname,"i").test(b_name)) {
                    resolve(b_url);
                    return;
                }
                if(type!="healthgrades" && !MTP.is_bad_name(my_query.name,b_name) && new RegExp(my_query.parsed_name.lname,"i").test(b_name) && (!MTurkScript.prototype.is_bad_url(b_url, bad_urls,-1)||

                    (type==='webmdquery' && /\.webmd\.com/.test(b_url) && /\/doctor\//.test(b_url) && !/find\-a\-doctor\//.test(b_url))) &&  (b1_success=true)) break;
            }
            if(b1_success && (resolve(b_url)||true)) return;
        }
        catch(error) {
            reject(error);
            return;
        }
    	do_next_query(resolve,reject,type);
        return;
    }
    function do_next_query(resolve,reject,type) {
        reject("Nothing found");
    }
    /* Search on bing for search_str, parse bing response with callback */
    function query_search(search_str, resolve,reject, callback,type) {
        console.log("Searching with bing for "+search_str);
        var search_URIBing='https://www.bing.com/search?q='+
            encodeURIComponent(search_str)+"&first=1&rdr=1";
        GM_xmlhttpRequest({method: 'GET', url: search_URIBing,
                           onload: function(response) { callback(response, resolve, reject,type); },
                           onerror: function(response) { reject("Fail"); },ontimeout: function(response) { reject("Fail"); }
                          });
    }


    /* Extra has some kinda of type field and a depth field indicating the depth */
Address.scrape_address=function(doc,url,resolve,reject,extra) {
    var type=extra.type,depth=extra.depth,links=doc.links,i,promise_list=[];
    Address.debug=extra.debug;
    var contact_regex=/(Contact|Location|Privacy|Kontakt|About)/i,bad_contact_regex=/^\s*(javascript|mailto):/i,contact2_regex=/contact[^\/]*/i;
    // if(/^(404|403|503|\s*Error)/i.test(doc.title) || /\?reqp\=1&reqr\=/.test(url)) my_query.failed_urls+=2;
    //console.log("In scrape_address for type="+type+", url="+url);
    if(depth===0) {
        for(i=0; i < links.length; i++) {
            links[i].href=MTP.fix_remote_url(links[i].href,url).replace(/\/$/,"");
            if((contact_regex.test(links[i].innerText) || contact2_regex.test(links[i].href))
               && !bad_contact_regex.test(links[i].href) &&
               !Address.queryList.includes(links[i].href) && Address.queryList.length<10) {
                Address.queryList.push(links[i].href);
                if(Address.debug) console.log("*** Following link labeled "+links[i].innerText+" to "+links[i].href);
                promise_list.push(MTP.create_promise(links[i].href,Address.scrape_address_page,function(result) {
                    console.log("! Finished parsing ") },MTP.my_catch_func,type));
                continue;
            }
        }
    }
    // scrape this page
    promise_list.push(new Promise((resolve1,reject1) => {
        Address.scrape_address_page(doc,url,resolve1,reject1,type);
    }).then(MTP.my_then_func).catch(MTP.my_catch_func));
    Promise.all(promise_list).then(function(result) {
        resolve(""); })
        .catch(function(result) { if(Address.debug) console.log("Done all promises in scrape_address for "+type);
                if(Address.debug) console.log("&& my_query.address_str_list="+JSON.stringify(Address.addressStrList));
                  resolve(""); });
};

    /* Following the finding the district stuff */
    function query_promise_then(result) {
        console.log("result="+JSON.stringify(result));
        my_query.practice_url=result;
        if(/\.webmd\.com/.test(result)) {
            return;
        }
    
        my_query.fields['office1_source_website']=result;
        add_to_sheet();
        var promise=MTP.create_promise(my_query.practice_url,Address.scrape_address,address_scrape_then,function(response) {
            console.log("Failed address"); },{type:"",depth:0});

    }

    function webmdquery_promise_then(result) {
        console.log("result="+JSON.stringify(result));
        my_query.practice_url=result;
        result=result.replace(/\-overview$/,'-appointments');
        let promise=MTP.create_promise(result,query_web_md,query_web_md_then,function(result) {
           find_healthgrades();
        });


    }
    function address_scrape_then(result) {
        //console.log("result="+result);
        Address.addressList.sort(function(a,b) { return a.priority-b.priority; });
        //console.log("addressList="+JSON.stringify(Address.addressList));
        if(Address.addressList.length>=1) {
            update_address(Address.addressList[0],'1');
            add_to_sheet();
        }
    }

    function query_web_md(doc,url,resolve,reject) {
        console.log("query_web_md,url="+url);
        var specialty;

        try {
            specialty=doc.querySelector(".prov-specialty-name").innerText.trim()
            specialty=specialty.replace("Geriatric Medicine","Geriatrics").replace("Pulmonary Disease","Pulmonary Medicine")
            .replace(/^Diabetes$/,"Endocrinology, Diabetes, & Metabolism").replace("General Practice","Internal Medicine")
            .replace("Child & Adolescent Psychiatry","Psychiatry").replace("Pulmonary Critical Care","Pulmonary Medicine")
            .replace("Cardiovascular Disease","Cardiology").replace("Endocrinology, Diabetes & Metabolism","Endocrinology Diabetes & Metabolism")
            .replace("Podiatric Medicine","Podiatry").replace("Child Neurology","Neurology").replace("Hematology/Oncology","Hematology & Oncology")
            .replace("Pediatric Pulmonology","Pulmonary Medicine").replace("Optometry","Optometrist").replace(/.*\sOncology.*$/,"Oncology").replace(/*Otolaryngology*/i,"Otolaryngology");
            console.log("SPECIALTY: "+specialty);
            document.querySelector("[name='specialty1']").value=specialty;
        }
        catch(err) {
            console.log("specialty name not found"); }

        var loc=doc.querySelector(".location-practice-name a");
        if(my_query.fields['office1_source_website']!==undefined &&my_query.fields['office1_source_website'].length>0) return;
        if(loc) { let promise=MTP.create_promise(loc.href,query_md_practice,resolve,reject); }
        else reject("");
    }

    function query_md_practice(doc,url,resolve,reject) {
        console.log("query_web_md_practice,url="+url);
        //if(my_query.fields['09_website_01'].length>0) return;
        var name,add_text,add;
        name=doc.querySelector(".topoffice h4");
        if(my_query.fields['office1_source_website']!==undefined &&my_query.fields['office1_source_website'].length>0) return;
        try {
            add_text=doc.querySelector('.address strong').innerHTML.replace('<br>','\n').trim();
        }
        catch(error) {
            console.log("bad md_query");
            return;
        }
        add=new Address(add_text,-50);
        var phone=doc.querySelector(".practicephone").innerText.trim();
        var fax=doc.querySelector("[itemprop='faxNumber']").innerText.trim().replace(/^\s*Fax:\s*/,"");
        my_query.fields['office1_name']=name.innerText.trim();
        my_query.fields['office1_phone_number']=phone;
        my_query.fields['office1_fax_number']=fax;
        my_query.fields['office1_source_website']=url;
        update_address(add,'1');
        add_to_sheet();
        if(!/Not Av/.test(fax)) resolve("");
        else reject("");


    }

    function query_web_md_then(result) {
        console.log("query_web_md_then,result="+JSON.stringify(result));
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
        //update_address();
        for(x in my_query.fields) {
            if(/^undefined/.test(x)) continue;
            //console.log("my_query.fields["+x+"]="+my_query.fields[x]);
            if(field=document.getElementsByName(x)[0]) field.value=my_query.fields[x];
        }
    }

    function submit_if_done() {
        var is_done=true,x;
        add_to_sheet();
        for(x in my_query.done) if(!my_query.done[x]) is_done=false;
        if(is_done && !my_query.submitted && (my_query.submitted=true)) MTurk.check_and_submit();
    }
   
    function update_address(address,suffix) {
        var top,x;
        top=address;
        //console.log("address="+JSON.stringify(address));
        top.zip=top.postcode;
        console.log("top="+JSON.stringify(top));
        

        for(x in top) {
            //console.log("Adding "+x+"_"+suffix);
           my_query.fields["office"+suffix+"_"+x]=top[x];
        }


    }
    function remove_phones(text,suffix,target) {
        var split=text.split(/\n/);

        var ret="",match,matched_phone=false,i;
        var phone_prefix_map={"01":"07","02":"16"},fax_prefix_map={"01":"08","02":"17"};
        var pasted_name=/office\d_name/.test(target.name),fax_match;
        for(i=0;i<split.length;i++) {
            if(fax_match=split[i].match(/Fax:\s*([\(]?[0-9]{3}([\)]?[-\s\.\/]|\))[0-9]{3}[-\s\.\/]+[0-9]{4,6})/)) {
                my_query.fields["office"+suffix+"_fax_number"]="1"+fax_match[1].replace(/[^\d]+/g,"");
                split[i]=split[i].replace(fax_match[0],'');

            }
            if(i===0 && pasted_name && !/[\d]/.test(split[i])) {
                console.log("Added "+"office"+suffix+"_name to equal "+split[i].trim());
                my_query.fields["office"+suffix+"_name"]=split[i].trim();
                continue;
            }
            match=split[i].match(phone_re);
            if(match) {
                if(!matched_phone && (matched_phone=true)) {
                    my_query.fields["office"+suffix+"_phone_number"]=match[0].replace(/[^\d]+/g,"");
                }
                else {
                    my_query.fields["office"+suffix+"_fax_number"]="1"+match[0].replace(/[^\d]+/g,""); }
            }
            else {
                ret=ret+(ret.length>0?"\n":"")+split[i];
            }
        }
        console.log("Returning ret="+ret);
        return ret;
    }
    function do_address_paste(e) {
        e.preventDefault();
        var text = e.clipboardData.getData("text/plain");
        var match=e.target.name.match(/(\d)\_/);

        var suffix=match?match[1]:"1";
        if(text.indexOf("\n")===-1 && !my_query.fields[e.target.name]) my_query.fields[e.target.name]=text;
        text=text.replace(/\s\|\s/g,"\n");
        console.log("text="+text);
        text=remove_phones(text,suffix,e.target);
        text=text.replace(/\s*\n\s*/g,",").replace(/,,/g,",").replace(/,\s*$/g,"").trim();
        console.log("e.target.name="+e.target.name);
        console.log("text="+text);
        var my_add=new Address(text,-50);
        if(my_add.priority<1000) {
            update_address(my_add,suffix); }
        add_to_sheet();
     //  add_text(text);
    }
    function do_phone_paste(e) {
        e.preventDefault();
        var text = e.clipboardData.getData("text/plain");
        text=text.replace(/[^\d]+/g,"").replace(/^1/,"");
        if(/fax/.test(e.target.name)) text="1"+text;
        my_query.fields[e.target.name]=text;
        add_to_sheet();
    }

    function do_fax_paste(e) {
        e.preventDefault();
        var text = e.clipboardData.getData("text/plain");
        text=text.replace(/[^\d]+/g,"").replace(/^1/,"");
        if(/fax/.test(e.target.name)) text="1"+text;
        my_query.fields[e.target.name]=text;
        add_to_sheet();
    }

     function do_web_paste(e) {
        e.preventDefault();
        var text = e.clipboardData.getData("text/plain");

        my_query.fields[e.target.name]=text;
        add_to_sheet();
    }


    function addr_cmp(add1,add2) {
        if(!(add1 instanceof Address && add2 instanceof Address)) return 0;
        if(add1.priority<add2.priority) return -1;
        else if(add1.priority>add2.priority) return 1;
        else return 0;
    }

    function find_healthgrades(e) {
        const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(my_query.name+" "+my_query.state + " site:healthgrades.com", resolve, reject, query_response,"healthgrades");
        });
        queryPromise.then(healthgrades_promise_then)
            .catch(function(val) {
            console.log("Failed at this healthgradesPromise " + val);


        });
    }

    function healthgrades_promise_then(result) {
        my_query.healthgrades=result;
        console.log("my_query.healthgrades=",my_query.healthgrades);
        var promise=MTP.create_promise(my_query.healthgrades,parse_healthgrades,parse_healthgrades_then,function() { });

    }

    function parse_healthgrades(doc,url,resolve,reject) {
        var loc=doc.querySelector(".office-location");
      //  console.log("loc=",loc);
        var h3=loc.querySelector(".visit-practice-link");
        var add=loc.querySelector("address");
        var phone=loc.querySelector("[href^='tel']");
        var fax=loc.querySelector("[href^='fax']");
        if(fax) {
            if(h3) my_query.fields.office1_name=h3.innerText.trim();
            if(h3) h3.parentNode.removeChild(h3);
        //    console.log("add=",add);
            if(add) {
                let span=add.querySelectorAll("span span");
                if(span.length===0) span=add.querySelectorAll("span");
                let add_str="";
                let i;
                for(i=0;i<span.length;i++) {
                    add_str=add_str+(add_str.length>0?", ":"")+span[i].innerText.trim();
                }
                let parsed_add=new Address(add_str);
              //  console.log("parsed_add=",parsed_add)
                update_address(parsed_add,"1");
            }
            if(phone) my_query.fields.office1_phone_number=phone.href.replace(/[^\d]+/g,"");
            if(fax) my_query.fields.office1_fax_number=fax.href.replace(/[^\d]+/g,"").replace(/^1/,"");
            //console.log("phone=",phone,"fax=",fax);
            my_query.fields.office1_source_website=url;
        }

        resolve("");
    }
    function parse_healthgrades_then() {
        add_to_sheet();
    }

    function init_Query()
    {
        console.log("in init_query rochargrove");
        var i,x;

        var links=document.querySelectorAll("form a");
        links[2].href=links[2].href.replace(/\+Fax$/i,"").replace(/\+NULL/ig,"")
        var my_href=links[2].href.replace(/\+Fax$/i,"").replace(/\+NULL/ig,"").replace(/\%20/g," ").replace(/^.*\?q\=(.*)$/,"$1");

        var split=my_href.split("++");
               split[0]=split[0].replace(/\+/g," ");
        if(split.length<2) {
            let my_match_re=/^(.*)\s((?:[^\s]+)\s(?:[^\s]+))$/;
            let match=my_href.replace(/\+/g," ").match(my_match_re);
            if(match) {
                split=[match[1],match[2]];
            }
        }
        split[1]=split[1].replace(/\+/g," ");
        console.log("my_href="+my_href+",split="+split);

        var their_query_str=split[0];//document.querySelectorAll("form div div span")[2].innerText.trim();
        console.log("their_query_str="+their_query_str);
        var name_re=/^([A-Z\-\s\.,]+)?\s(?:(?:MD)|(?:DO)|(?:FNP)|(?:NP)\s)?(.*)$/;
      //var end_re=/[A-Z][a-z]+(\s)
        var name_match=their_query_str.match(name_re);
        if(name_match && name_match[1]) {
            //name_match[1]=name_match[1].replace(/\s(MD|DO|FNP|Physician|NP).*$/,"");
        }
        var state_match=split[1].match(/ ([A-Z]{2})\s*$/);
        console.log("name_match="+JSON.stringify(name_match));
        var phone_list=["office1_phone_number","office2_phone_number"];
        var fax_list=["office1_fax_number","office2_fax_number"];
        document.getElementsByName("office1_address1")[0].addEventListener("paste",do_address_paste);
         document.getElementsByName("office1_name")[0].addEventListener("paste",do_address_paste);
        document.getElementsByName("office2_name")[0].addEventListener("paste",do_address_paste);
        document.getElementsByName("office2_address1")[0].addEventListener("paste",do_address_paste);
        //document.querySelectorAll("[name='source_quality']")[1].addEventListener("click",find_healthgrades);

        for(x of phone_list) {
            document.querySelector("[name='"+x+"']").addEventListener("paste",do_phone_paste);
        }
         for(x of fax_list) {
            document.querySelector("[name='"+x+"']").addEventListener("paste",do_fax_paste);
        }
          for(x of ['office1_source_website','office2_source_website']) {
            document.querySelector("[name='"+x+"']").addEventListener("paste",do_web_paste);
        }
        //var wT=document.getElementById("DataCollection").getElementsByTagName("table")[0];
        //var dont=document.getElementsByClassName("dont-break-out");
        my_query={name:name_match?name_match[1]:'',specialty:name_match?name_match[2]:"",state:state_match?reverse_state_map[state_match[1]]:'',url:"",fields:
                  {},done:{},submitted:false};
        console.log("temp=",my_query.name.replace(/^([^\s]*\s[^\s]*).*$/,"$1"));
        my_query.parsed_name=MTP.parse_name(my_query.name.replace(/^([^\s]*\s[^\s]*).*$/,"$1"));
        console.log("my_query.parsed_name=",my_query.parsed_name);
	console.log("my_query="+JSON.stringify(my_query));
         var search_str=my_query.name+" "+name_match[2]+" "+my_query.state;
        const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(search_str, resolve, reject, query_response,"query");
        });
        queryPromise.then(query_promise_then)
            .catch(function(val) {
            console.log("Failed at this queryPromise " + val);


        });
const webmdqueryPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(search_str+" site:webmd.com", resolve, reject, query_response,"webmdquery");
        });
        webmdqueryPromise.then(webmdquery_promise_then)
            .catch(function(val) {
            find_healthgrades(); });


     //  var promise=MTP.create_promise(my_query.url,parse_hpd,parse_hpd_then);
    }

})();