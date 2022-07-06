// ==UserScript==
// @name         DUNS
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  collect DUNS from DNB
// @author       You
// @include        http://*.mturkcontent.com/*
// @include        https://*.mturkcontent.com/*
// @include        http://*.amazonaws.com/*
// @include        https://*.amazonaws.com/*
// @include https://worker.mturk.com/*
// @include https://www.dnb.com/*
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
// @require https://raw.githubusercontent.com/spencermountain/compromise/master/builds/compromise.js
// @require https://www.google.com/recaptcha/api.js?render=explicit
// @require https://www.gstatic.com/recaptcha/releases/M-QqaF9xk6BpjLH22uHZRhXt/recaptcha__en.js
// @resource GlobalCSS https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/globalcss.css
// ==/UserScript==

(function() {
    'use strict';
    var my_query = {};
    var bad_urls=[];
    /* TODO should be requester #, last field should be if it's crowd or not */
    var MTurk=new MTurkScript(20000,750+(Math.random()*1000),[],begin_script,"A1OXDH2AW8WRVU",true);
    var MTP=MTurkScript.prototype;
    var executedRecaptcha=false;
    function is_bad_name(b_name)
    {
        return false;
    }

    if(/dnb\.com/.test(window.location.href)) {

        let div2=document.createElement("div");
        deleteAllCookies();
            unsafeWindow.localStorage.clear();
                    deleteGMCookies([],true);
    div2.id="recaptcha1";
    div2.className="g-recaptcha";
    document.body.appendChild(div2);
        GM_addValueChangeListener("my_query",function() {
            my_query=arguments[2];

         /*   document.querySelector("[name='businessName']").value=my_query.name;
            document.querySelector("[name='zip']").value=my_query.zipcode;
            document.querySelector("[name='city']").value=my_query.city;*/
            console.log("my_query triggered");
            if(executedRecaptcha) {
                            setTimeout(resetRecaptcha,1000);
            }
            else setTimeout(executeRecaptcha,1000);
        });
    }

      function deleteGMCookies(toKeep, deleteAll) {
        GM_cookie.list({ url: 'dnb.com' }, function(cookies, error) {
            if (!error) console.log("my_cookies=",cookies);
            else console.log("error=",error);
            let cookie;
            for(cookie of cookies) {
                //console.log("cookie=",cookie," cookie.httpOnly=",cookie.httpOnly);
                if((!toKeep.includes(cookie.name) && (cookie.httpOnly||true))||(!!deleteAll)) {
                    console.log("Deleting cookie ", cookie);
                    GM_cookie.delete({ name: cookie.name }, function() {
                        console.log(error || 'success');
                    });

                }
            }
            /* logs something like this:
    [
        {
            domain: "https://example.com"
            hostOnly: true
            httpOnly: false
            name: "name"
            path: "/"
            sameSite: "no_restriction"
            secure: false
            session: true
            value: "some_value"
        }
    ]
    */
        });
    }

    function parse_features(features) {
                    deleteGMCookies([],true);
        features=document.querySelectorAll(".feature-offer");

        var max_mbps=0;
        var feature,match;
        var speed_re=/Up to ([\d,]+) ([A-Z]{1}bps)/;
        for(feature of features) {
            var f_text=feature.querySelector(".feature-offer__text__card-header__title__subheader").innerText.trim();
            console.log("f_text=",f_text);
            match=f_text.match(speed_re);
            if(match) {
                console.log("f_text=",f_text," match=",match);
                let temp_speed=parseInt(match[1].replace(/,/g,""));
                if(match[2].toLowerCase()==='gbps') temp_speed*=1000;
                if(temp_speed>max_mbps) {
                    max_mbps=temp_speed;
                }
            }
        }

        GM_setValue("results",{date:Date.now(),"service_available":max_mbps>0?"yes":"no","max_speed":max_mbps});
    }

    function deleteAllCookies() {
        var cookies = unsafeWindow.document.cookie.split(";");

        for (var i = 0; i < cookies.length; i++) {

            let  d = window.location.hostname.split(".");
            while (d.length > 0) {
                let cookieBase = encodeURIComponent(cookies[i].split(";")[0].split("=")[0]) + '=; expires=Thu, 01-Jan-1970 00:00:01 GMT; domain=' + d.join('.') + ' ;path=';
                let p = location.pathname.split('/');
                unsafeWindow.document.cookie = cookieBase + '/';
                while (p.length > 0) {
                    unsafeWindow.document.cookie = cookieBase + p.join('/');
                    p.pop();
                };
                d.shift();
            }
        }
        cookies = document.cookie.split("; ");
        for (var c = 0; c < cookies.length; c++) {
            var d = window.location.hostname.split(".");
            while (d.length > 0) {
                var cookieBase = encodeURIComponent(cookies[c].split(";")[0].split("=")[0]) + '=; expires=Thu, 01-Jan-1970 00:00:01 GMT; domain=' + d.join('.') + ' ;path=';
                var p = location.pathname.split('/');
                document.cookie = cookieBase + '/';
                while (p.length > 0) {
                    document.cookie = cookieBase + p.join('/');
                    p.pop();
                };
                d.shift();
            }
        }
        cookies = unsafeWindow.document.cookie.split(";");
        console.log("cookies=",cookies);
    }

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
				
				if(parsed_context.url&&!MTP.is_bad_url(parsed_context.url,bad_urls,-1)) {
                resolve(parsed_context.url);
                return;
            }
				} 
            if(lgb_info&&(parsed_lgb=MTP.parse_lgb_info(lgb_info))) {
                    console.log("parsed_lgb="+JSON.stringify(parsed_lgb)); 
					if(parsed_lgb.url&&!MTP.is_bad_url(parsed_lgb.url,bad_urls,-1)) {
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
                if(!MTurkScript.prototype.is_bad_url(b_url, bad_urls) && !MTurkScript.prototype.is_bad_name(b_name,my_query.name,p_caption,i)
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

    function parse_result(response) {
        console.log("response=",response);
        try {
            var obj=JSON.parse(response.responseText);
            console.log("obj=",obj);

            let url="https://www.dnb.com/services/decryptDuns";
            let good_obj=null;
            if(obj.searchCandidates.length===1) good_obj=obj.searchCandidates[0];

            if(obj.searchCandidates.length>=1) {
                let temp;
                for(temp of obj.searchCandidates) {
                    if(temp.primaryAddress.addressLocality.name.toLowerCase() === my_query.city.toLowerCase()) {
                        good_obj=temp;
                        break;
                    }
                }
            }
             console.log("good_obj=",good_obj);
            if(!good_obj) {
                 GM_setValue("result",{success:false,date:Date.now()});
                setTimeout(function() { window.location.reload(); }, 500);
            }


                let payload={"encryptedDuns":good_obj.duns};
                let data=JSON.stringify(payload);

                let headers={"referer":"https://www.dnb.com/duns-number/lookup.html","content-type":"application/json"};
                console.log("payload=",payload);
                GM_xmlhttpRequest({method: 'POST', url: url, data:data,headers:headers,
                                   onload: function(response) { parse_result2(response); },
                                   onerror: function(response) { console.log("Fail"); },ontimeout: function(response) { reject("Fail"); }
                                  });
       /*     }
            else {
                GM_setValue("result",{success:false,date:Date.now()});
                setTimeout(function() { window.location.reload(); }, 500);

            }*/
        }
        catch(e) {

                        GM_setValue("result",{success:false,date:Date.now()});
                  setTimeout(function() { window.location.reload(); }, 500);

            return;
        }
    }

    function parse_result2(response) {
        console.log("parse_result2,response=",response);
        var obj=JSON.parse(response.responseText);
        GM_setValue("result",{success:true,duns:obj.duns,date:Date.now()});
        setTimeout(function() { window.location.reload(); }, 500);
    }


    var curr_token = null;
    var clientId = null;

    var locationUrl = window.location.host;


    function executeRecaptcha() {
        console.log("grecaptcha=",grecaptcha);
        let x=document.querySelector("#input-1");
        console.log("x=",x);
        try {
            clientId = grecaptcha.render('recaptcha1', {
                'sitekey':
                '6LeawI0UAAAAAGVzP_YkKRfJ0LKDsYjojdO40zhV',
                'badge': 'inline',
                'size': 'invisible'
            });
            grecaptcha.execute(clientId, {
                action: window.location.href.includes('lookup') ? 'lookup' : 'registerSearch'
            })
                .then(function(token) {
                curr_token=token;
                console.log("curr_token=",curr_token);
                let criteria={"addressRegion":reverse_state_map[my_query.state],
                              // "addressLocality":my_query.city,

                              "countryISOAlpha2Code": "US",
                              "pageNumber": 1,
                              "pageSize": 10,
                              "searchTerm": my_query.name};
                let fields= ["primaryName", "primaryAddress", "telephone", "duns", "dunsControlStatus", "corporateLinkage"]
                let payload={criteria:criteria,fields:fields,token:curr_token};
                let my_string=JSON.stringify(payload);
                console.log("my_string=",my_string);
                let url="https://www.dnb.com/services/criteriaSearch";

                let headers={"referer":"https://www.dnb.com/duns-number/lookup.html","content-type":"application/json"};
                console.log("payload=",payload);
                GM_xmlhttpRequest({method: 'POST', url: url, data:my_string,headers:headers,
                                   onload: function(response) { parse_result(response); },
                                   onerror: function(response) { console.log("Fail"); },ontimeout: function(response) { reject("Fail"); }
                                  });
                executedRecaptcha=true;

            });
        }
        catch(e) {
            window.location.reload();
        }
    }
//    grecaptcha.ready(executeRecaptcha);

    function resetRecaptcha() {
                console.log("grecaptcha=",grecaptcha);

         clientId = grecaptcha.render('g-recaptcha-response', {
        'sitekey': !(locationUrl.includes('stg') || locationUrl.includes('qa') || locationUrl.includes('localhost')) ?
        '6LeawI0UAAAAAGVzP_YkKRfJ0LKDsYjojdO40zhV' : '6Ldc1YwUAAAAACJL9ogockkU2a3_AjO8boy6ZPiJ',
        'badge': 'inline',
        'size': 'invisible'
    });
        grecaptcha.reset(clientId);
        executeRecaptcha();
    }


    function init_Query()
    {
		bad_urls=bad_urls.concat(default_bad_urls);
        console.log("in init_query");
        var i;
        var div=document.querySelectorAll("crowd-form div div ul li");

        my_query={name,fields:{},done:{},
		  try_count:{"query":0},
		  submitted:false};
        for(i of div) {
            let strong=i.querySelector("strong").innerText.replace(/^.*Org\s*/,"").replace(/:\s*/,"").trim();
            let rest = i.innerText.replace(/^[^:]*:\s*/,"").trim();
            my_query[strong.toLowerCase()]=rest;

        }
        my_query.name=MTP.shorten_company_name(my_query.name);

       
	console.log("my_query="+JSON.stringify(my_query));
        my_query.date=Date.now();
        GM_addValueChangeListener("result",function() {
            console.log("result=",arguments[2]);
            let result=arguments[2];
            if(result.success) {
                my_query.fields.DUNS_NEW=arguments[2].duns;
                setTimeout(function() {
                    submit_if_done(); }, 2500);
            }
            else {
                setTimeout(function() { GM_setValue("returnHit",true) }, 2500);
            }
        });
        GM_setValue("my_query",my_query);



    }
  

})();