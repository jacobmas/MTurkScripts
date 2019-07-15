// ==UserScript==
// @name         AdminTurk
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  New script
// @author       You
// @include        http://*.mturkcontent.com/*
// @include        https://*.mturkcontent.com/*
// @include        http://*.amazonaws.com/*
// @include        https://*.amazonaws.com/*
// @include https://worker.mturk.com/*
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
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/9d648488f201401227bc24a9a0bdb63f2d9a17f6/Govt/Government.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/Address.js
// @require https://raw.githubusercontent.com/spencermountain/compromise/master/builds/compromise.min.js
// @resource GlobalCSS https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/globalcss.css
// ==/UserScript==

(function() {
    'use strict';
    var my_query = {};
    var bad_urls=[];
    var MTurk=new MTurkScript(20000,750+(Math.random()*1000),[],begin_script,"A3X6453XXCWPL",true);
    var MTP=MTurkScript.prototype;
    function is_bad_name(b_name)
    {
        return false;
    }

    function query_response(response,resolve,reject,type) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        console.log("in query_response\n"+response.finalUrl);
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
                console.log("parsed_context="+JSON.stringify(parsed_context)); } 
            if(lgb_info&&(parsed_lgb=MTP.parse_lgb_info(lgb_info))) {
                    console.log("parsed_lgb="+JSON.stringify(parsed_lgb)); }
            for(i=0; i < b_algo.length&&i<2; i++) {
                b_name=b_algo[i].getElementsByTagName("a")[0].textContent;
                b_url=b_algo[i].getElementsByTagName("a")[0].href;
                b_caption=b_algo[i].getElementsByClassName("b_caption");
                p_caption=(b_caption.length>0 && b_caption[0].getElementsByTagName("p").length>0) ?
                    p_caption=b_caption[0].getElementsByTagName("p")[0].innerText : '';
                console.log("("+i+"), b_name="+b_name+", b_url="+b_url+", p_caption="+p_caption);
                if(/linkedin\.com/.test(b_url)) {
                    let b_split=b_name.split(/\s-\s/);
                    if(b_split.length>1 && b_split[0].indexOf(my_query.fields.contactName.replace(/\s.*$/,""))!==-1) {
                        my_query.fields.contactName=b_split[0].trim();
                        resolve("");
                        return;
                    }
                }
                //if(!MTurkScript.prototype.is_bad_url(b_url, bad_urls) && !is_bad_name(b_name) && (b1_success=true)) break;
            }
            if(b1_success && (resolve(b_url)||true)) return;
        }
        catch(error) {
            reject(error);
            return;
        }
        reject("Nothing found");
        return;
    }

    function query_promise_then(result) {
        var fullname=MTP.parse_name(my_query.fields.contactName),x;
        var field_map={"Equity Residential":fullname.fname.charAt(0).toLowerCase()+fullname.lname.toLowerCase()+"@eqr.com"};
        for(x in field_map) {
          //  console.log("x="+x+", field_map[x]="+field_map[x]+", my_query.fields.company===x: "+(my_query.fields.company===x));
            if(my_query.fields.companyName===x) my_query.fields.email=field_map[x];
        }
        my_query.done.query=true;

        submit_if_done();
    }

    /* Search on bing for search_str, parse bing response with callback */
    function query_search(search_str, resolve,reject, callback,type,filters) {
        console.log("Searching with bing for "+search_str);
        if(!filters) filters="";
        var search_URIBing='https://www.bing.com/search?q='+
            encodeURIComponent(search_str)+"&filters="+filters+"&first=1&rdr=1";
        GM_xmlhttpRequest({method: 'GET', url: search_URIBing,
                           onload: function(response) { callback(response, resolve, reject,type); },
                           onerror: function(response) { reject("Fail"); },ontimeout: function(response) { reject("Fail"); }
                          });
    }

    /* Following the finding the district stuff */
    function add_promise_then(result) {
        my_query.done.address=true;
        Address.addressList.sort(Address.cmp);
        if(Address.addressList.length>0) {
            let curr=Address.addressList[0];
            Object.assign(my_query.fields,{address1:curr.address1,address2:curr.address2,city:curr.city,state:curr.state,zip:curr.postcode});
        }
        submit_if_done();
    }

    function gov_promise_then(my_result) {
        var i,curr,fullname,x,num;
        my_query.done.gov=true;
        console.log("\n*** Gov.phone="+Gov.phone);
        var result=Gov.contact_list;
        var temp;
        var person_list=[];
        console.log("Gov result="+JSON.stringify(result));

        for(i=0;i<result.length;i++) {
            temp=new PersonQual(result[i],my_query.url);
            console.log("("+i+"), "+JSON.stringify(temp));
            if(temp.quality>0) {
                person_list.push(temp); }
        }
        person_list.sort(PersonQual.cmp_people);
        if(person_list.length>0) {
            Object.assign(my_query.fields,{contactName:person_list[0].name,contactTitle:person_list[0].title,
                                           email:person_list[0].email,phone:person_list[0].phone});
        }
        if(my_query.fields.phone.length===0 && Gov.phone.length>0) my_query.fields.phone=Gov.phone;
        console.log("Calling submit if done from gov_promise_then, person_list="+JSON.stringify(person_list));
        submit_if_done();
        //        console.log("result="+JSON.stringify(result));
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
        for(x in my_query.fields) {
            if((MTurk.is_crowd && (field=document.getElementsByName(x)[0])) ||
               (!MTurk.is_crowd && (field=document.getElementById(x)))) field.value=my_query.fields[x];
        }
    }

    function submit_if_done() {
        var is_done=true,x;
        add_to_sheet();
        for(x in my_query.done) if(!my_query.done[x]) is_done=false;
        if(is_done && !my_query.submitted && (my_query.submitted=true)) {
            let lst=["contactName","contactTitle"];
            for(x of lst) {
                if(my_query.fields[x].length===0) my_query.fields[x]="n/a";
            }
            add_to_sheet();
            MTurk.check_and_submit();
        }
    }

    function parse_equity(doc,url) {
        var member=doc.querySelectorAll(".team-member"),x;
        var name="",title="";
        for(x of member) {
            name=x.querySelector("h4");
            title=x.querySelector("p");
            if(name&&title&&!my_query.fields.contactName) {
                my_query.fields.contactName=name.innerText.trim();
                my_query.fields.contactTitle=title.innerText.trim();
                my_query.done.query=false;
                const queryPromise = new Promise((resolve, reject) => {
                    console.log("Beginning URL search");
                    query_search(my_query.fields.contactName+" "+my_query.fields.contactTitle+" "+my_query.fields.communityName+" "+my_query.fields.companyName, resolve, reject, query_response,"query");
                });
                queryPromise.then(query_promise_then)
                    .catch(function(val) {
                    my_query.done.query=true;
                submit_if_done(); });
            }

        }
    }

    function fb_promise_then(result) {
        var url=result.replace(/m\./,"www.").
        replace(/facebook\.com\/([^\/]+).*$/,"facebook.com/pg/$1").replace(/\/$/,"")+"/about/?ref=page_internal";
        my_query.fb_url=url;
        console.log("FB promise_then, new url="+url);
        var promise=MTP.create_promise(url,MTP.parse_FB_about,parse_fb_about_then);

    }

    function parse_fb_about_then(result) {
        console.log("result="+JSON.stringify(result));
        my_query.done.fb=true;
        if(result.team.length>0) {
            var fullname=MTP.parse_name(result.team[0]);
            my_query.fields.contactName=result.team[0];
        }
        if(my_query.fields.communityName.length===0) {
            my_query.fields.communityName=result.pageTitle; }
        if(result.email&&my_query.fields.email.length===0) {
            my_query.fields.email=result.email;
        }
        if(result.phone&&my_query.fields.phone.length===0) my_query.fields.phone=result.phone;
        submit_if_done();

    }

    function parse_url(doc,url,resolve,reject) {
        var company_map={".equityapartments.com":{company:"Equity Residential",parser:parse_equity},
                         "/horizonrealtygroup.com":{company:"Horizon Realty Group"},
                        ".marriott.com":{company:"Marriott"}};
        var x,i,links=doc.links;
        var logo1=doc.querySelector("img.corporate-logo-image");
        var communitylogo1=doc.querySelector(".logo-container img");
        var copyright=doc.querySelector("#copyright,.copyright");
        var scion=doc.querySelector("div.scion-link");
        if(scion) my_query.fields.companyName="The Scion Group";
        if(logo1&&logo1.alt) my_query.fields.companyName=logo1.alt.replace(/ logo$/,"");
        else if(copyright) {
            let txt=copyright.innerText.trim();
            txt=txt.replace(/^[^©]*©((\s*)-?[\d]{4})?/,"").replace(/\..*$/,"").replace(/-All.*$/,"");
            my_query.fields.companyName=txt.trim();
        }
        if(communitylogo1&&communitylogo1.alt) my_query.fields.communityName=communitylogo1.alt;
        if(logo1&&communitylogo1&&my_query.fields.companyName===my_query.fields.communityName) my_query.fields.companyName="Cardinal Group Management";
        else {
            for(x in company_map) {
                if(url.indexOf(x)!==-1) {
                    my_query.fields.companyName=company_map[x].company;
                    if(company_map[x].parser) {
                        company_map[x].parser(doc,url); }
                    let bob=url.replace(/\/$/,"").replace(/^.*\/([^\/]*)$/,"$1");
                    while(/(^|-)([a-z])/.test(bob)) {
                        bob=bob.replace(/(^|-)([a-z])/,function(match,p1,p2) {
                        return p1+p2.toUpperCase(); })
                    }
                    bob=bob.replace(/-/g," ");
                    if(my_query.fields.companyName==="Marriott") bob=bob.replace(/^[^\s]*\s/,"");
                    my_query.fields.communityName=bob;
                }
            }
        }

        for(i=0; i < links.length; i++) {

             if(/facebook\.com\/.+/.test(links[i].href) && (/\/pages\//.test(links[i].href) || !MTP.is_bad_fb(links[i].href)) &&
               my_query.fb_url.length===0 && !my_query.found_fb) {
                console.log("FOUND FB");
                my_query.found_fb=true;
                my_query.done.fb=false;
                my_query.fb_url=links[i].href.replace(/\?.*$/,"").replace(/\/pages\/([^\/]*)\/([^\/]*)/,"/$1-$2");
                fb_promise_then(my_query.fb_url);
            }
        }


        resolve("");
    }
    function url_promise_then(result) {
        my_query.done.url=true;
        submit_if_done();
    }

    function init_Query()
    {
        console.log("in init_query");
        var i;
       // var wT=document.getElementById("DataCollection").getElementsByTagName("table")[0];
        //var dont=document.getElementsByClassName("dont-break-out");
        my_query={url:document.querySelector("form a").href,

                  name,fb_url:"",found_fb:false,
                  fields:{email:"",contactName:"",contactTitle:"",phone:"",companyName:"",communityName:"",address1:"",
                         address2:"",city:"",state:"",zip:""},
                  done:{gov:false,address:false,url:false},submitted:false};
	console.log("my_query="+JSON.stringify(my_query));
        var search_str;

        var dept_regex_lst=[];

        var title_regex_lst=[/Admin|Administrator|Supervisor|Manager|Director|Founder|Owner|Officer|Secretary|Assistant/i];
        //var promise=MTP.create_promise(
        var query={dept_regex_lst:dept_regex_lst,
                       title_regex_lst:title_regex_lst,id_only:false,default_scrape:false,debug:false};

        var url_promise=MTP.create_promise(my_query.url,parse_url,url_promise_then,function(result) {
            console.log("Failed at Gov "+result);
            my_query.done.url=true;
            submit_if_done(); });

        var add_promise=MTP.create_promise(my_query.url,Address.scrape_address,add_promise_then,function(result) {
            console.log("Failed at Gov "+result);
            my_query.done.address=true;
            submit_if_done(); },{extra:""});

        var gov_promise=MTP.create_promise(my_query.url,Gov.init_Gov,gov_promise_then,function(result) {
            console.log("Failed at Gov "+result);
            if(my_query.fields.email.length===0) my_query.fields.email="";
            my_query.done.gov=true;
            submit_if_done(); },query);

    }

})();
