// ==UserScript==
// @name         IDSchoolDirectories
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  New script
// @author       You
// @include        https://www.greatschools.org/schools/districts/*
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
// @connect *
// @connect crunchbase.com
// @require https://raw.githubusercontent.com/hassansin/parse-address/master/parse-address.min.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/jacobsscriptfuncs.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/d7978a85128aa64f91629d00b644b58748d9c42f/MTurkScript.js
// @resource GlobalCSS https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/globalcss.css
// ==/UserScript==

(function() {
    'use strict';
    var my_query = {};
    var bad_urls=["www.niche.com","www.greatschools.org","www.publicschoolreview.com",".facebook.com","en.wikipedia.org","ballotpedia.org",
                 "www.noodle.com","//high-schools.com","www.zillow.com","www.trulia.com","www.usnews.com","www.usboundary.com",
                 "//publicschoolsk12.com","www.publicschoolreview.com","www.schooldigger.com","www.care.com",".gov/",".educationbug.org",
                 "www.schoolmap.org","www.mapquest.com","//elementaryschools.org","www.realtor.com","www.usa.com","www.districtbug.org"];
    var Schools={contact_list:[],
             page_regex_str:"(www\\.|\/\/)(apptegy|catapultk12|cms4schools)\\.com|crescerance\\.com|cyberschool\\.com|"+
             "echalk\\.com|edlio\\.com|edlioschool\\.com|edline\\.net|educationalnetworks\\.net|"+
             "eschoolview\\.com|finalsite\\.com|foxbright\\.com|gabbart\\.com|gaggle\\.net|ilearnschools\\.org|"+
             "schooldesk\\.net|schoolloop\\.com|"+
	     "www\\.school(blocks|insites|messenger|pointe|webmasters)\\.com|"+
             "socs\\.fes\\.org|www\\.zumu\\.com",
             script_regex_lst:[{regex:/apptegy_cms\//,name:"apptegy"}]
            };

    Schools.id_page_type=function(doc,url,resolve,reject,query) {
        var page_type="none",i,match,copyright,sites_google_found=false,generator,gen_content;
        var page_type_regex2=/Apptegy/,copyright_regex=/Blackboard, Inc/,page_type_regex=new RegExp(Schools.page_regex_str,"i");
        for(i=0; i < (generator=doc.getElementsByName("generator")).length; i++) console.log("generator="+(generator[i].content));
       // console.log("in id_page_type");
        for(i=0; i < doc.links.length; i++) {
            if((match=doc.links[i].href.match(page_type_regex)) || (match=doc.links[i].innerText.match(page_type_regex2))) {
                page_type=match[0].replace(/\.[^\.]*$/,"").toLowerCase().replace(/^\/\//,"").replace(/www\./,"").replace(/\./g,"_");
                break; }
            else if(/sites\.google\.com/.test(doc.links[i].href)
                    && /Google Sites/i.test(doc.links[i].innerText)) sites_google_found=true;
        }
        doc.querySelectorAll("footer").forEach(function(footer) {
            if(footer.dataset.createSiteUrl&&/sites\.google\.com/.test(footer.dataset.createSiteUrl)) sites_google_found=true; });
        if(page_type==="none" && doc.getElementById("sw-footer-copyright")) page_type="blackboard";
        else if(page_type==="none"&& sites_google_found) page_type="sites_google";
        if(page_type==="none") {
            doc.querySelectorAll("script").forEach(function(curr_script) {
            for(i=0; i < Schools.script_regex_lst.length;i++) {
                if(curr_script.src&&
                   Schools.script_regex_lst[i].regex.test(curr_script.src)) page_type=Schools.script_regex_lst[i].name;
                else if(curr_script.innerHTML.indexOf("_W.configDomain = \"www.weebly.com\"")!==-1) generator=[{content:"weebly.com"}];
            }
            });
        }
	if(page_type==="none" && generator!==undefined && generator.length>0 && generator[0].content && generator[0].content.length>0) {
        var temp_gen;
       // console.log("Before contentreplace");
        if(/^Powered by\s*/i.test(generator[0].content)) {
            temp_gen=generator[0].content.replace(/^Powered By\s*/i,"").replace(/\s*-.*$/,"").replace(/\s+[\d\.]+$/,"").trim(); }
        else temp_gen=generator[0].content.replace(/Total WordPress/i,"WordPress").replace(/\s+.*$/,"");

        return temp_gen;
    }
	else return page_type;
    };
    //var MTurk=new MTurkScript(20000,200,[],init_Query,"[TODO]");
    function is_bad_name(b_name)
    {
	return false;
    }

    function query_response(response,resolve,reject,name) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        console.log("in query_response\n"+response.finalUrl);
        var search, b_algo, i=0, inner_a,b_url="crunchbase.com", b_name, b_factrow,lgb_info, b_caption,p_caption;
        var b1_success=false, b_header_search,b_context,parse_context,parse_lgb;
        try {
            search=doc.getElementById("b_content");
            b_algo=search.getElementsByClassName("b_algo");
            lgb_info=doc.getElementById("lgb_info");
            b_context=doc.getElementById("b_context");

            if(b_context) {
              //  console.log("in b_context");
                parse_context=MTurkScript.prototype.parse_b_context(b_context);
                if(parse_context && parse_context.Website && !MTurkScript.prototype.is_bad_url(parse_context.Website,bad_urls,-1)
                   && (resolve({name:name,url:parse_context.Website}))) return;
            }
          //  console.log("pre_lgb");
            if(lgb_info && (parse_lgb=MTurkScript.prototype.parse_lgb_info(lgb_info)) && parse_lgb.url
               && !MTurkScript.prototype.is_bad_url(parse_lgb.url,bad_urls,-1)) {
                    resolve({name:name,url:parse_lgb.url});
                    return;
            }
            //console.log("b_algo.length="+b_algo.length);
            for(i=0; i < b_algo.length && i < 5; i++)
            {
                b_name=b_algo[i].getElementsByTagName("a")[0].textContent;
                b_url=b_algo[i].getElementsByTagName("a")[0].href;
                b_caption=b_algo[i].getElementsByClassName("b_caption");
                p_caption="";
                if(b_caption.length>0 && b_caption[0].getElementsByTagName("p").length>0) {
                    p_caption=b_caption[0].getElementsByTagName("p")[0].innerText;
                }
                console.log("("+i+"), b_name="+b_name+", b_url="+b_url+", p_caption="+p_caption);
                if(!MTurkScript.prototype.is_bad_url(b_url,bad_urls,5) && !is_bad_name(b_name) && (b1_success=true)) break;
            }
            if(b1_success && (resolve({name:name,url:b_url}))) return;
        }
        catch(error) {
            reject({name:name,error:error});
                      return;
        }
        reject({name:name,message:"Failed to Load"});
        return;

    }

    /* Search on bing for search_str, parse bing response with callback */
    function query_search(search_str, resolve,reject, callback,name) {
        console.log("Searching with bing for "+search_str);
        var search_URIBing='https://www.bing.com/search?q='+
	    encodeURIComponent(search_str)+"&first=1&rdr=1";
	GM_xmlhttpRequest({method: 'GET', url: search_URIBing,
            onload: function(response) { callback(response, resolve, reject,name); },
            onerror: function(response) { reject({name:name,message:"Fail"}); },
            ontimeout: function(response) { reject({name:name,message:"Fail"}); }
            });
    }

    /* Following the finding the district stuff */
    function query_promise_then(result) {
        my_query.totalSchools++;
        var promise=MTurkScript.prototype.create_promise(result.url,do_id,done_school,my_catch_func,result.name);
    }
    function my_catch_func(response) {
        console.log("Failed to load "+response);
        my_query.failed_list.push(response.name);
        done_school("");
    }
    function do_id(doc,url,resolve,reject,name) {
        var query={name:name};
        var page_type=Schools.id_page_type(doc,url,resolve,reject,query);
        if(my_query.district_list[page_type]===undefined) {
            my_query.district_list[page_type]=[]; }
        my_query.district_list[page_type].push({url:url,name:name});
        resolve(url);
    }

    function done_school(result) {
        my_query.doneSchools++;
        var x,i;
        console.log("doneSchools="+my_query.doneSchools);
        if(my_query.doneSchools>=my_query.totalSchools) {
            print_failed();
            print_list();
            //console.log("my_query.district_list="+JSON.stringify(my_query.district_list));
        }
    }
    function print_failed() {
        for(i=0; i < my_query.failed_list.length; i++) { console.log(my_query.failed_list[i]); }
    }

    function print_list() {
        var finished_regex=/^(apptegy|edlio|gabbart|school(insites|messenger)|sites_google|socs_fes)$/;
        for(var x in my_query.district_list) {
            if(finished_regex.test(x)) continue;
                console.log("*** "+x+" ***");
                for(var i=0; i < my_query.district_list[x].length; i++) console.log(my_query.district_list[x][i].url+"|"+my_query.district_list[x][i].name);
            }
    }

    function dist_promise(name,state) {
        var search_str=name+" "+state;
        const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(search_str, resolve, reject, query_response,name);
        });
        queryPromise.then(query_promise_then)
            .catch(function(val) {
            console.log("Failed at this queryPromise " + val); GM_setValue("returnHit",true); });
        return queryPromise;
    }
    function init_Query()
    {
        console.log("in init_query");
        my_query={state:document.title.replace(/All school districts in /,"").replace(/,.*$/,""),district_list:{},
                  failed_list:[],doneSchools:0,totalSchools:0};
        console.log("my_query="+JSON.stringify(my_query));
        var table=document.getElementsByTagName("table")[0],i,promise_list=[];
        //my_query.totalSchools=table.rows.length-1;
        var begin=1;
        for(i=begin; i < table.rows.length && i < begin+250; i++) {
            promise_list.push(dist_promise(table.rows[i].cells[0].innerText,my_query.state));
        }

    }
    init_Query();

})();