// ==UserScript==
// @name         Daniel Stapleton
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
// @require https://raw.githubusercontent.com/spencermountain/compromise/master/builds/compromise.min.js
// @resource GlobalCSS https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/globalcss.css
// ==/UserScript==

(function() {
    'use strict';
    var my_query = {};
    var bad_urls=[];
    /* TODO should be requester #, last field should be if it's crowd or not */
    var MTurk=new MTurkScript(20000,750+(Math.random()*1000),[],begin_script,"A3JYVE7NY0BYFD",true);
    var MTP=MTurkScript.prototype;
    function is_bad_name(b_name)
    {
        return false;
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

    function query_response(response,resolve,reject,type) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        console.log("in query_response\n"+response.finalUrl+", type="+type);
        var search, b_algo, i=0, inner_a;
        var b_url="crunchbase.com", b_name, b_factrow,lgb_info, b_caption,p_caption;
        var b1_success=false, b_header_search,b_context,parsed_context,parsed_lgb;
        try
        {
            search=doc.getElementById("b_content");
			b_algo=doc.querySelectorAll("#b_results  .b_algo");
            lgb_info=doc.getElementById("lgb_info");
            b_context=doc.getElementById("b_context");
            console.log("b_algo.length="+b_algo.length);
            if(b_context&&(parsed_context=MTP.parse_b_context(b_context))) {
                console.log("parsed_context="+JSON.stringify(parsed_context));
                if(parsed_context.url && !MTP.is_bad_url(parsed_context.url,bad_urls,-1)) {
                    my_query.fields.companyURL=parsed_context.url;
                }
                if(type==="query" && parsed_context.url&&!MTP.is_bad_url(parsed_context.url,bad_urls,-1)) {
                    resolve(parsed_context.url);
                    return;
                }
            }
            if(lgb_info&&(parsed_lgb=MTP.parse_lgb_info(lgb_info))) {
                    console.log("parsed_lgb="+JSON.stringify(parsed_lgb)); 
					if(type==="query" && parsed_lgb.url&&!MTP.is_bad_url(parsed_lgb.url,bad_urls,-1)) {
                resolve(parsed_lgb.url);
                return;
            }
					
					}
            for(i=0; i < b_algo.length; i++) {
                b_name=b_algo[i].querySelector("h2 a").textContent;
                b_url=b_algo[i].getElementsByTagName("a")[0].href;
                b_caption=b_algo[i].getElementsByClassName("b_caption");
                p_caption=(b_caption.length>0 && b_caption[0].getElementsByTagName("p").length>0) ?
                    p_caption=b_caption[0].getElementsByTagName("p")[0].innerText : (b_algo[i].querySelector("p")? b_algo[i].querySelector("p").innerText.trim():"");
                console.log("("+i+"), b_name="+b_name+", b_url="+b_url+", p_caption="+p_caption);

                if(type==="dnb" && !MTurkScript.prototype.is_bad_name(b_name.replace(/ Company Profile.*$/,""),my_query.name,p_caption,i)
		   && (b1_success=true)) break;
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
    function dnb_promise_then(result) {
        my_query.dnb=result;
        var promise=MTP.create_promise(my_query.dnb,AggParser.parse_dnb, parse_dnb_then,function() { my_query.done.dnb=true; submit_if_done(); });
    }

    function parse_dnb_then(result) {
        console.log("result=",result);
        my_query.done.dnb=true;
        my_query.fields.companyName=result.name;
        if(result.website) my_query.fields.companyURL=result.website;
        my_query.fields.companyHQ=my_query.location;
        my_query.fields.companyType="7"
        var x;
        for(x of result.industry_links) {
            if(x.length===0) continue;
            var re_list=[[/Plastics/,"133"],[/Trucking|Transportation/,"92"],[/Social Advocacy/,"90"],[/Food Services/,"34"],
                         [/Finance /,"43"],[/Amusement /,"30"]];
            var y;
            for(y of re_list) {
                //console.log(y[0]);
                if(y[0].test(x)) my_query.fields.companyIndustry=y[1];
            }
            if(/Retail Trade/.test(x)) my_query.fields.companyIndustry="27";
            else if(/Offices of Physicians/.test(x)) my_query.fields.companyIndustry="13";
            else if(/Wholesale/.test(x)) my_query.fields.companyIndustry="133";

        }
        let emp=parseInt(result.employees);
        if(emp===1) my_query.fields.companySize="1";
        else if(emp<=10) my_query.fields.companySize="2";
        else if(emp<=50) my_query.fields.companySize="3";
        else if(emp<=200) my_query.fields.companySize="4";
        else if(emp<=500) my_query.fields.companySize="5";


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
        var strong=document.querySelectorAll("crowd-form div strong");

        my_query={name:strong[1].innerText.trim(),location:strong[2].innerText.trim(),
                  fields:{companyName:"",companyIndustry:"",companyURL:"",companyHQ:"",companyType:"",
                         companySize:""},
                  done:{dnb:false},
		  try_count:{"dnb":0},
		  submitted:false};
	console.log("my_query="+JSON.stringify(my_query));
        var search_str=my_query.name+" "+my_query.location+" site:dnb.com";
        const dnbPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(search_str, resolve, reject, query_response,"dnb");
        });
        dnbPromise.then(dnb_promise_then)
            .catch(function(val) {
            console.log("Failed at this queryPromise " + val); GM_setValue("returnHit",true); });
    }

})();