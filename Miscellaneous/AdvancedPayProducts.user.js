// ==UserScript==
// @name       AdvancedPayProducts
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  New script
// @author       You
// @include        http://*.mturkcontent.com/*
// @include        https://*.mturkcontent.com/*
// @include        http://*.amazonaws.com/*
// @include        https://*.amazonaws.com/*
// @include https://worker.mturk.com/*
// @include https://www.facebook.com/*
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
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/87bbbec009460d3330c174d120eb4aa5745a79a6/js/MTurkScript.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/Govt/Government.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/Address.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/AggParser.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/Email/MailTester.js
// @require https://raw.githubusercontent.com/spencermountain/compromise/master/builds/compromise.js
// @resource GlobalCSS https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/globalcss.css
// ==/UserScript==

(function() {
    'use strict';
    var my_query = {};
    var bad_urls=[];
    /* TODO should be requester #, last field should be if it's crowd or not */
    var MTurk=new MTurkScript(60000,750+(Math.random()*1000),[],begin_script,"A1NMLY3SPE09QH",true);
    console.log("window.location.href=",window.location.href);
    var MTP=MTurkScript.prototype;
    function is_bad_name(b_name)
    {
        return false;
    }

       /* Extra has some kinda of type field and a depth field indicating the depth */
 

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
			b_algo=doc.querySelectorAll("#b_results > .b_algo");
            lgb_info=doc.getElementById("lgb_info");
            b_context=doc.getElementById("b_context");
            console.log("b_algo.length="+b_algo.length);
            if(b_context&&(parsed_context=MTP.parse_b_context(b_context))) {
                console.log("parsed_context="+JSON.stringify(parsed_context));
		
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
            for(i=0; i < b_algo.length&&i<2; i++) {
                b_name=b_algo[i].querySelector("h2 a").textContent;
                b_url=b_algo[i].getElementsByTagName("a")[0].href;
                b_caption=b_algo[i].getElementsByClassName("b_caption");
                p_caption=(b_caption.length>0 && b_caption[0].getElementsByTagName("p").length>0) ?
                    p_caption=b_caption[0].getElementsByTagName("p")[0].innerText : (b_algo[i].querySelector("p")? b_algo[i].querySelector("p").innerText.trim():"");
                console.log("("+i+"), b_name="+b_name+", b_url="+b_url+", p_caption="+p_caption);
                if(type==="query" && !MTurkScript.prototype.is_bad_url(b_url, bad_urls) &&
                   (b_url.indexOf(my_query.name+".")!==-1 || !MTurkScript.prototype.is_bad_name(b_name,my_query.name,p_caption,i))
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
    function query_promise_then(result) {
        my_query.fields.brandSite=result;
        add_to_sheet();
        let temp_url=result.replace(/(^https?:\/\/[^\/]*).*$/,"$1")+"/collections/all";
        console.log("temp_url=",temp_url);
        var promise=MTP.create_promise(temp_url,parse_website,parse_website_then,function() { GM_setValue("returnHit",true); });
    }


    function parse_website(doc,url,resolve,reject) {
        var l;
        console.log("parse_website,url=",url,"doc=",doc);
        var names=MTP.find_company_name_on_website(doc,url,false);
        if(names.length>0&&!my_query.fields.brandName) {
            my_query.fields.brandName=names[0].name;
        }
                var items=doc.querySelectorAll("#MainContent .product-block");

        if(!items) items=doc.querySelectorAll("#MainContent .grid__item");
        if(!items) items=doc.querySelectorAll("article");
        var item;
        var i;
        console.log("items.length=",items.length);

        for(i=0;i< items.length&&i<5;i++) {
            console.log("items["+i+"]=",items[i]);
            my_query.fields["product"+(i+1)+"Units"]="1 unit";
            let link=items[i].querySelector(".grid-view-item__link");
            if(!link) {
                link=items[i].querySelector("a");
                my_query.fields["product"+(i+1)+"Link"]=MTP.fix_remote_url(link.href,url);
//                let name=link.querySelector(".card-information__text,h5");
  //              if(name) my_query.fields["product"+(i+1)+"Name"]=name.innerText.trim();
                my_query.fields["product"+(i+1)+"Name"]=link.innerText.trim();

            }
            else {
                my_query.fields["product"+(i+1)+"Name"]=link.innerText.trim();

                my_query.fields["product"+(i+1)+"Link"]=MTP.fix_remote_url(link.href,url);
            }
            let price=items[i].querySelector(".price-item,.money");
            if(!price) price=items[i].querySelector(".price");
            my_query.fields["product"+(i+1)+"Price"]=price.innerText.trim().replace(/[^\$€0-9\.]/g,"");

        }
        resolve("");
    }

    function parse_website_then(result) {
        console.log("* Address.addressList=",Address.addressList);
         Address.addressList.sort(function(a,b) { return a.priority-b.priority; });
        if(Address.addressList.length>0){
            let add=Address.addressList[0];
            console.log("* add=",add);
            if(add.city && add.state) {
                my_query.fields.brandLocation=add.city+", "+add.state;
            }
            else if(add.country) {
                my_query.fields.brandLocation=add.country;
            }
        }
        my_query.done.query=true;
        submit_if_done();
    }


    function begin_script(timeout,total_time,callback) {
        if(timeout===undefined) timeout=200;
        if(total_time===undefined) total_time=0;
        if(callback===undefined) callback=init_Query;
        if(MTurk!==undefined) { callback(); }
        else if(total_time<5000) {
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
        console.log("* submit_if_done, my_query.done=",my_query.done);
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
        var a = document.querySelector("crowd-form a");
        my_query={name:a.innerText.trim(),fields:{brandName:"",brandSite:""},
                  done:{query:false},
		  try_count:{"query":0},
		  submitted:false};
        for(i=1;i<=5;i++) {
            let my_list=["Price","Units","Link","Name"];
            let x;
            for(x of my_list) {
                my_query.fields["product"+i+x]="";
            }
        }
	console.log("my_query="+JSON.stringify(my_query));
        var search_str;
        const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(my_query.name, resolve, reject, query_response,"query");
        });
        queryPromise.then(query_promise_then)
            .catch(function(val) {
            console.log("Failed at this queryPromise " + val); my_query.done.query=true; my_query.done.gov=true; submit_if_done(); });
        

    }

})();