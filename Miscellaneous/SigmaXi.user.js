// ==UserScript==
// @name         SigmaXi
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
// @grant GM_cookie
// @grant GM.cookie
// @connect google.com
// @connect bing.com
// @connect yellowpages.com
// @connect *
// @require https://raw.githubusercontent.com/hassansin/parse-address/master/parse-address.min.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/js/MTurkScript.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/Govt/Government.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/Address.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/AggParser.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/Email/MailTester.js
// @require https://raw.githubusercontent.com/jacobmas/pdf.js/master/dist/pdf.js

// @require https://raw.githubusercontent.com/jacobmas/pdf.js/master/dist/pdf.worker.js
// @require https://raw.githubusercontent.com/spencermountain/compromise/master/builds/compromise.js
// @resource GlobalCSS https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/globalcss.css
// ==/UserScript==

(function() {
    'use strict';
    var my_query = {};
    var bad_urls=["en.wikipedia.org",".academia.edu",".ssrn.com","researchgate.net","scholar.google.com","arounddeal.com","/rocketreach.co","contactout.com"];
    /* TODO should be requester #, last field should be if it's crowd or not */
    var MTurk=new MTurkScript(60000,750+(Math.random()*1000),[],begin_script,"A30TPP0MDSW913",true);
    var MTP=MTurkScript.prototype;
    function is_bad_name(b_name)
    {
        return false;
    }
    function matches_institution(email_domain, institution_domains) {
        if(institution_domains) {
            if(typeof(institution_domains)==='string' && institution_domains.toLowerCase()!=email_domain.toLowerCase()) {
                return false;
            }
            else if(typeof(institution_domains)==='object' && institution_domains.constructor.indexOf("Array")!=-1) {
                let item, matched=false;
                for(item of institution_domains) {
                    if(item.toLowerCase()===email_domain.toLowerCase()) {
                        matched=true;
                        break;
                    }
                }
                if(!matched) {
                    return false;
                }

            }
        }
    }
    /* Returns a score of how well a name matches email, 0 meaning not at all */
    function score_name_to_email(name, email, institution_domains) {
        const email_domain=email.replace(/^[^@]*@/).trim();
        const email_begin=email.replace(/@.*$/,"").toLowerCase().trim();
        const parsed_name = MTurkScript.prototype.parse_name(name);
        const fname = parsed_name.fname.toLowerCase();
        const mname=parsed_name.mname.toLowerCase();

        const lname=parsed_name.lname.toLowerCase();
        // Check institution domain
        if(institution_domains && !matches_institution(email_domain, institution_domains)) return -1;
        if(/^(support|info|media|marketing|webmaster)$/.test(email_begin)) return -1;

        const always_good_prefixes = [fname+"\\."+lname,fname.substr(0,1)+lname,fname.substr(0,1)+"\\."+lname,fname.substr(0,1)+"_"+lname,
                                     fname+"_"+lname,lname+"\\."+fname,lname+"_"+fname,lname+"_"+fname.substr(0,1),fname+"\\."+mname.substr(0,1)+"\\."+lname];
        let prefix;
        for(prefix of always_good_prefixes) {
            if(new RegExp("^"+prefix).test(email_begin)) {
                return 10;
            }
        }
        let single;
        const single_name_matches=[fname,lname];
        for(single of single_name_matches) {
            if(email_begin===single) {
                return 5;
            }
        }
        let mixed=[fname.substr(0,1)+"[^a-z]*"+lname+"[^a-z]*"];
        for(single of mixed) {
            if(new RegExp("^"+mixed).test(email_begin)) {
                return 4;
            }
        }

        return 0;


    }

    function query_response(response,resolve,reject,type) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        console.log("in query_response\n"+response.finalUrl+", type="+type," try_count=",my_query.try_count[type]);
        var search, b_algo, i=0, inner_a;
        var b_url="crunchbase.com", b_name, b_factrow,lgb_info, b_caption,p_caption;
        var b1_success=false, b_header_search,b_context,parsed_context,parsed_lgb;
        var b_url_list=[];
        try
        {
            search=doc.getElementById("b_content");
            b_algo=doc.querySelectorAll("#b_results > .b_algo");
            lgb_info=doc.getElementById("lgb_info");
            b_context=doc.getElementById("b_context");
            console.log("b_algo.length="+b_algo.length);
            if(b_context&&(parsed_context=MTP.parse_b_context(b_context))) {
                console.log("parsed_context="+JSON.stringify(parsed_context));

                if(parsed_context.url&&!MTP.is_bad_url(parsed_context.url,bad_urls,-1)) {

                }
            }
            if(lgb_info&&(parsed_lgb=MTP.parse_lgb_info(lgb_info))) {
                console.log("parsed_lgb="+JSON.stringify(parsed_lgb));
                if(parsed_lgb.url&&!MTP.is_bad_url(parsed_lgb.url,bad_urls,-1)) {

                }

            }
            for(i=0; i < b_algo.length&&i<5; i++) {
                b_name=b_algo[i].querySelector("h2 a").textContent;
                b_url=b_algo[i].querySelector("h2 a").href;
                b_caption=b_algo[i].getElementsByClassName("b_caption");
                p_caption=(b_caption.length>0 && b_caption[0].getElementsByTagName("p").length>0) ?
                    p_caption=b_caption[0].getElementsByTagName("p")[0].innerText : (b_algo[i].querySelector("p")? b_algo[i].querySelector("p").innerText.trim():"");
                console.log("("+i+"), b_name="+b_name+", b_url="+b_url+", p_caption="+p_caption);
                let temp_match=p_caption.match(email_re);
                    if(temp_match&&!/contactout.com/.test(b_url)) {
                        console.log("temp_match=",temp_match);
                        let k;
                        for(k of temp_match) {
                         if(k.toLowerCase().indexOf(my_query.parsed_name.lname.replace(/\'/g,"").toLowerCase())!==-1||
                            (my_query.parsed_name.fname.length>1 && k.toLowerCase().indexOf(my_query.parsed_name.fname.replace(/\'/g,"").toLowerCase())!==-1) ||
                           (my_query.name.toLowerCase().indexOf(k.replace(/@.*$/,"").toLowerCase())!==-1)
                           ) {
                             my_query.fields.email=k;
                             add_to_sheet();
                             submit_if_done();
                             return;
                         }
                        }
                    }
                if(!MTurkScript.prototype.is_bad_url(b_url, bad_urls,-1)
                   && (b1_success=true)&&i<4) {
                     
                    b_url_list.push(b_url);




                   // break;
                }

            }
            if(b1_success && (resolve(b_url_list)||true)) return;
        }
            catch(error) {
                reject(error);
                return;
            }
            do_next_query(resolve,reject,type);
            return;
        }
        function do_next_query(resolve,reject,type) {
            if(my_query.try_count[type]===0 && type==="query") {
                my_query.try_count[type]++;
                query_search(my_query.name+" "+my_query.institution+" filetype:pdf", resolve, reject, query_response,"query");
                return;
            }
            else if(my_query.try_count[type]===1 && type==="query") {
                my_query.try_count[type]++;
                query_search(my_query.name+" "+my_query.institution+" email filetype:pdf", resolve, reject, query_response,"query");
                return;
            }
            reject("Nothing found");
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
    function query_promise_then(result) {
        my_query.url=result;
        var promise_list=[];
        var url;
        for(url of result) {
            if(/\.pdf/.test(url)) {


            }
            else {
                let promise=MTP.create_promise(url,parse_website,function() { },function() { console.log("Failed"); });
                promise_list.push(promise);
            }

        }
        Promise.all(promise_list).then(parse_website_then).catch(parse_website_then);
    }
    function rating_cmp(a,b) {
        return b.rating-a.rating;
    }
    function parse_website(doc,url,resolve,reject) {
        console.log("parse_website,url=",url);
        Gov.scrape_lone_emails(doc,url);
        var scripts=doc.querySelectorAll("script");
        var x;
        for(x of scripts) {
            //console.log("x=",x.outerHTML);
            let match;
            if(match=x.innerHTML.match(/document\.write/)) {//\(\"\<n uers=\\\"([<])*/)) {
                console.log("match=",match);
            }
        }
                //znvygb:eubaqqn\056wbarf\100wph\056rqh\056nh\">eubaqqn\056wbarf\100wph\056rqh\056nh<\057n>".replace(/[a-zA-Z]/g, function(c){return String.fromCharCode((c<="Z"?90:122)>=(c=c.charCodeAt(0)+13)?c:c-26);})

        let i;
        for(i=0;i<Gov.email_list.length;i++) {
            Gov.email_list[i].rating=score_name_to_email(my_query.name,Gov.email_list[i].email);
        }

        Gov.email_list.sort(rating_cmp);


        console.log("Gov.email_list=",Gov.email_list);
        var curr;
        for(curr of Gov.email_list) {
            if(!my_query.fields.email && (curr.email.toLowerCase().indexOf(my_query.parsed_name.lname.replace(/\'/g,"").substring(0,6).toLowerCase())!==-1||
              (my_query.parsed_name.fname.length>1 && curr.email.toLowerCase().indexOf(my_query.parsed_name.fname.replace(/\'/g,"").substring(0,6).toLowerCase())!==-1) ||

                                         (my_query.name.toLowerCase().indexOf(curr.email.replace(/@.*$/,"").toLowerCase())!==-1)
                                         ) && curr.rating>0) {
                console.log("curr=",curr,"curr.rating=",curr.rating);
                my_query.fields.email=curr.email;
                break;
            }
        }
        resolve("");
    }

    function parse_website_then() {
        if(!my_query.fields.email && my_query.try_count["query"]===0) {
            my_query.try_count["query"]++;
            var search_str=my_query.name+" "+my_query.institution;
            const queryPromise = new Promise((resolve, reject) => {
                console.log("Beginning URL search");
                query_search(search_str+" filetype:pdf", resolve, reject, query_response,"query");
            });
            queryPromise.then(query_promise_then)
                .catch(function(val) {
                console.log("Failed at this queryPromise " + val); GM_setValue("returnHit",true); });
            return;
        }
     /*   else if(!my_query.fields.email && my_query.try_count["query"]===1) {
            my_query.try_count["query"]++;
            let search_str=my_query.name+" "+my_query.institution+" email";
            const queryPromise = new Promise((resolve, reject) => {
                console.log("Beginning URL search");
                query_search(search_str+" filetype:pdf", resolve, reject, query_response,"query");
            });
            queryPromise.then(query_promise_then)
                .catch(function(val) {
                console.log("Failed at this queryPromise " + val); GM_setValue("returnHit",true); });
            return;
        }*/
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
            setTimeout(function() { begin_script(timeout,total_time,callback); },600);
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
        var is_done=true,x,is_done_dones=x;
        add_to_sheet();
        for(x in my_query.done) if(!my_query.done[x]) is_done=false;
        is_done_dones=is_done;
        for(x in my_query.fields) if(!my_query.fields[x]) is_done=false;
        if(is_done && !my_query.submitted && (my_query.submitted=true)) MTurk.check_and_submit();
        else if(is_done_dones && !my_query.submitted) {
            console.log("Failed to find all fields");
            GM_setValue("returnHit",true);
        }
    }

    function init_Query()
    {
                bad_urls=bad_urls.concat(default_bad_urls);
        console.log("in init_query");
        var i;
       var a =document.querySelectorAll("crowd-form div a");
        var inst_list=a[1].innerText.trim().trim().split(/[,;]\s*/);
        my_query={name:a[0].innerText.trim().trim(),
                  institution: a[1].innerText.trim().trim(),
                  fields:{email:""},done:{},curr_btn:-1,
                  try_count:{"query":0},
                  submitted:false};
        my_query.parsed_name=MTP.parse_name(my_query.name);
        var found_good=false;
        for(i of inst_list) {
            if(/(^| )(Univ)/.test(i.trim())) {
                my_query.institution=i.trim();
                found_good=true;
                break;
            }
        }
        if(!found_good) {
            for(i of inst_list) {
                if(/(^| )(Institute)/.test(i.trim())) {
                    my_query.institution=i.trim();
                    break;
                }
            }
        }
        if(/,/.test(my_query.institution)) my_query.institution=inst_list[0].trim();
        my_query.institution=my_query.institution.replace(/ and .*$/,"");
                console.log("my_query="+JSON.stringify(my_query));

      
        var search_str=my_query.name+" "+my_query.institution;
        const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(search_str, resolve, reject, query_response,"query");
        });
        queryPromise.then(query_promise_then)
            .catch(function(val) {
            console.log("Failed at this queryPromise " + val); GM_setValue("returnHit",true); });
    }

})();