// ==UserScript==
// @name         Aidin
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
    var MTurk=new MTurkScript(20000,750+(Math.random()*1000),[],begin_script,"A3S8R4UTTPQDCC",false);
    var MTP=MTurkScript.prototype;
    function is_bad_name(b_name,orig_name,p_caption,i,type)
    {
        if(/^npino/.test(type) && /^(Nursing Homes|Assisted living facilities|Home Health Agencies) in /i.test(b_name)) return true;
        return false;
    }

    function query_response(response,resolve,reject,type) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        console.log("in query_response\n"+response.finalUrl+", type="+type+",try_count="+my_query.try_count[type]);
        var search, b_algo, i=0, inner_a;
        var b_url="crunchbase.com", b_name, b_factrow,lgb_info, b_caption,p_caption;
        var b1_success=false, b_header_search,b_context,parsed_context,parsed_lgb,d_ans;
        try
        {
            search=doc.getElementById("b_content");
            b_algo=search.getElementsByClassName("b_algo");
            lgb_info=doc.getElementById("lgb_info");
            b_context=doc.getElementById("b_context");
            d_ans=doc.querySelector("#d_ans");
            console.log("b_algo.length="+b_algo.length);
            if(/^query$/.test(type)&&d_ans) {
                console.log("d_ans.innerText="+d_ans.innerText);
                let match;
                if(match=d_ans.innerText.match(/Fax:\s*([\(]?[0-9]{3}([\)]?[-\s\.\/]|\))[0-9]{3}[-\s\.\/]+[0-9]{4,6})/)) {
                    my_query.fields.textinput=match[1].trim();
                    resolve("");
                    return;
                }
            }
            if(b_context&&(parsed_context=MTP.parse_b_context(b_context))) {
                console.log("parsed_context="+JSON.stringify(parsed_context));
                if(/^query$/.test(type) && (parsed_context.url)) {
                    resolve(parsed_context.url);
                    return;
                }
                if(/^init$/.test(type) && parsed_context.Title&&(parsed_context.url||parsed_context.Phone)) {
                    my_query.temp_name=parsed_context.Title;
                    resolve("");
                    return;
                }
            }
            if(lgb_info&&(parsed_lgb=MTP.parse_lgb_info(lgb_info))) {
                console.log("parsed_lgb="+JSON.stringify(parsed_lgb));
                if(parsed_lgb.name && parsed_lgb.phone) {
                    my_query.temp_name=parsed_lgb.name;
                    resolve("");
                    return;
                }

            }
            if(/^init$/.test(type)) {
                   // my_query.name=parsed_context.Title;
                    resolve("");
                    return;
                }
            for(i=0; i < b_algo.length&&i<3; i++) {
                b_name=b_algo[i].getElementsByTagName("a")[0].textContent;
                b_url=b_algo[i].getElementsByTagName("a")[0].href;
                b_caption=b_algo[i].getElementsByClassName("b_caption");
                p_caption=(b_caption.length>0 && b_caption[0].getElementsByTagName("p").length>0) ?
                    p_caption=b_caption[0].getElementsByTagName("p")[0].innerText : '';
                console.log("("+i+"), b_name="+b_name+", b_url="+b_url+", p_caption="+p_caption);
                if(/^hipaa$/.test(type)) {
                    b_name=b_name.replace(/^[^\|]*\|\s*/,""); }
                if(/^hpd$/.test(type)) b_name=b_name.replace(/\s+NPI\s.*$/,"");
                if(!/^query$/.test(type) && !MTurkScript.prototype.is_bad_name(b_name,my_query.name,p_caption,i) && !is_bad_name(b_name,my_query.name,p_caption,i,type)
		   && (b1_success=true)) break;
                else if(/^query$/.test(type) && i < 2 && !MTurkScript.prototype.is_bad_url(b_url, bad_urls) &&
                        !MTurkScript.prototype.is_bad_name(b_name.replace(/\s[\|\-]+.*$/,""),my_query.name,p_caption,i)
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
        var type_map={"hipaa":"hipaaspace.com","hpd":"healthprovidersdata.com","npino":"npino.com"};
        if(/^(hpd|hipaa|npino)$/.test(type) && my_query.try_count[type]===0) {
            my_query.try_count[type]++;
            query_search(my_query.name+" "+my_query.state+" site:"+type_map[type], resolve, reject, query_response,type);
            return;
        }
        if(/^(hpd|hipaa|npino)$/.test(type) && my_query.try_count[type]===1) {
            my_query.try_count[type]++;
            query_search(my_query.name+" site:"+type_map[type], resolve, reject, query_response,type);
            return;
        }
        if(/^(hpd|hipaa|npino)$/.test(type) && my_query.try_count[type]===2) {
            my_query.try_count[type]++;
            query_search(my_query.temp_name+" "+my_query.state+" site:"+type_map[type], resolve, reject, query_response,type);
            return;
        }


        reject("Nothing found");
    }



    function hipaa_promise_then(result) {
        my_query.hipaa_url=result;
        var promise=MTP.create_promise(result,parse_hipaa,parse_hipaa_then,function() {
            my_query.done.hipaa=true;
            submit_if_done();
        });
    }

    function parse_npino(doc,url,resolve,reject) {
        console.log("In npino, url="+url);
        var table=doc.querySelector("table.table-condensed");
        var x,y;
        if(!table) {
            reject("");
            return;
        }
        for(x of table.rows) {
            if(/Address/.test(x.cells[0].innerText)) {
                y=x.cells[1].innerText.trim();
                if(! new RegExp(my_query.city,"i").test(y) ||
                  (!new RegExp(my_query.state,"i").test(y))) {
                    resolve("");
                    return;
                }
            }

            if(/Fax Number/.test(x.cells[0].innerText)) {
                console.log("Found fax, x="+x.innerText);
                y=x.cells[1].innerText.trim();
                if(y.length>=4&&!my_query.fields.textinput) {
                    console.log("# setting fax npino"); my_query.fields.textinput=y; }
                resolve("");
                return;
            }
        }
        resolve("");
    }


    function npino_promise_then(result) {
        my_query.npino_url=result;
        var promise=MTP.create_promise(result,parse_npino,parse_npino_then,function() {
            my_query.done.npino=true;
            submit_if_done();
        });
    }
    function parse_hipaa_then(result) {
        //if(result&&result.length>0) my_query.fields.textinput=result;
        my_query.done.hipaa=true;
        submit_if_done();
    }

    function parse_hipaa(doc,url,resolve,reject) {
        console.log("in parse_hipaa,url="+url);
        var row=doc.querySelector("dl");
        if(!row) {
            resolve("");
            return;
        }
        var dt=row.querySelectorAll("dt");
        var x,passed_provider=false,y;
        for(x of dt) {
            //console.log("x="+x.innerText);
            if(/Provider Practice/i.test(x.innerText)) {
                console.log("Found passed_provider"); passed_provider=true; }
            if(passed_provider && /City/i.test(x.innerText)) {
                y=x.nextElementSibling;

                if(! new RegExp(my_query.city,"i").test(y.innerText.trim())) {
                    resolve("");
                    return;
                }
            }
            if(passed_provider && /Fax/i.test(x.innerText)) {
                y=x.nextElementSibling;
                console.log("Found fax,y="+y.innerText.trim());

                if(y.innerText.trim().length>=4&&!my_query.fields.textinput) {
                    my_query.fields.textinput=y.innerText.trim();
                    resolve("");
                    return;
                }
            }
        }
        resolve("");
        return;

    }

    function parse_npino_then(result) {
        //if(result&&result.length>0) my_query.fields.textinput=result;
        my_query.done.npino=true;
        submit_if_done();
    }

    function hpd_promise_then(result) {
        my_query.hpd_url=result;
        var promise=MTP.create_promise(result,parse_hpd,parse_hpd_then,function() {
            my_query.done.hpd=true;
            submit_if_done();
        });
    }

    function parse_hpd(doc,url,resolve,reject) {
                var fax_re=/Fax:\s*([\(]?[0-9]{3}([\)]?[-\s\.\/]|\))[0-9]{3}[-\s\.\/]+[0-9]{4,6})/i;

                console.log("in parse_hpd,url="+url);
        var p=doc.querySelector("#DetailedInformationContent p.blockquoute"),match;
        if(!p||!new RegExp(my_query.city,"i").test(p.innerText)||!new RegExp(state_map[my_query.state]).test(p.innerText)) {
            resolve("");
            return;
        }
        if((match=p.innerText.match(fax_re))) {
            console.log("matched fax in parse_hpd, "+JSON.stringify(match));
            if(match[1].trim().length>=5&&!my_query.fields.textinput) {
                console.log("adding in parse_hpd, "+match[1].trim());
                my_query.fields.textinput=match[1].trim();
                resolve("");
                return;
            }
        }
        resolve("");
        return;


    }

    function parse_hpd_then(result) {
        //if(result&&result.length>0) my_query.fields.textinput=result;
        my_query.done.hpd=true;
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
    function query_promise_then(result) {
        console.log("query_promise_then,result="+result);
        if(result.length>0) {
            console.log("Doing promise");
            var promise=MTP.create_promise(result,parse_page,parse_page_then,function() {
                my_query.done.query=true;
            submit_if_done();
            });
            return;
        }
        else {
            my_query.done.query=true;
            submit_if_done();
        }
    }
    function parse_page(doc,url,resolve,reject) {
        console.log("parse_page,url="+url);
        var links=doc.links;
        var fax_re=/F(?:ax:|)\s*([\(]?[0-9]{3}([\)]?[-\s\.\/]|\))[0-9]{3}[-\s\.\/]+[0-9]{4,6})/i;
        var match,x;
        var promise_list=[];
        if((match=doc.body.innerText.match(fax_re))) {
            console.log("matched in parse_page,match="+JSON.stringify(match));
            my_query.fields.textinput=match[1].trim(); }
        resolve("");
        return;
    }

    function parse_page_then(result) {
        my_query.done.query=true;
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
        if(my_query.fields.textinput&&my_query.fields.textinput.length>=5) {
            let temp=my_query.fields.textinput.replace(/[^\d]*/g,"");
            my_query.fields.textinput=temp.substring(0,3)+"-"+temp.substring(3,6)+"-"+temp.substring(6,10);
        }
        for(x in my_query.fields) {
            if((field=document.getElementsByName(x)[0])) field.value=my_query.fields[x];
        }
    }

    function submit_if_done() {
        var is_done=true,x,is_done_dones=true;
        add_to_sheet();
        for(x in my_query.done) if(!my_query.done[x]) is_done=false;
        is_done_dones=is_done;
        if(my_query.fields.textinput.length===0) is_done=false;
        if(is_done && !my_query.submitted && (my_query.submitted=true)) {

            MTurk.check_and_submit();
        }
        else if(is_done_dones) {
            console.log("Failed to find");
            GM_setValue("returnHit"+MTurk.assignment_id,"true");
        }
    }

    function init_Query()
    {
        bad_urls=bad_urls.concat(default_bad_urls);
        console.log("in init_query");
        var i;
        var wT=document.getElementById("DataCollection").getElementsByTagName("table")[0];
        //var dont=document.getElementsByClassName("dont-break-out");
        my_query={name:wT.rows[0].cells[1].innerText.replace(/\s*\(.*$/,""),
                  temp_name:wT.rows[0].cells[1].innerText,address:wT.rows[2].cells[1].innerText,city:wT.rows[3].cells[1].innerText,
                  state:wT.rows[4].cells[1].innerText,zip:wT.rows[5].cells[1].innerText,
                  fields:{textinput:""},
                  done:{hipaa:false,npino:false,query:false,hpd:false},
		  try_count:{"query":0,"hipaa":0,"npino":0,"hpd":0},
		  submitted:false};
	console.log("my_query="+JSON.stringify(my_query));
        var search_str=my_query.name+" "+my_query.address+" "+my_query.city+" "+my_query.state+" "+my_query.zip;
        const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(search_str, resolve, reject, query_response,"init");
        });
        queryPromise.then(init_promise_then)
            .catch(function(val) {
            console.log("Failed at this initPromise " + val); GM_setValue("returnHit"+MTurk.assignment_id,true); });

    }


    function init_promise_then(result)
    {
        console.log("init_promise_then,result="+result);
        var search_str=my_query.name+" "+my_query.city+" "+my_query.state;
        const hipaaspacePromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(search_str+" site:hipaaspace.com", resolve, reject, query_response,"hipaa");
        });
        hipaaspacePromise.then(hipaa_promise_then)
            .catch(function(val) {
            console.log("Failed at this hipaapromise " + val);
            my_query.done.hipaa=true;
            submit_if_done();
             });


        const npinoPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(search_str+" site:npino.com", resolve, reject, query_response,"npino");
        });
        npinoPromise.then(npino_promise_then)
            .catch(function(val) {
            my_query.done.npino=true;
            submit_if_done();
        });
        const hpdPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(search_str+" site:healthprovidersdata.com", resolve, reject, query_response,"hpd");
        });
        hpdPromise.then(hpd_promise_then)
            .catch(function(val) {
            my_query.done.hpd=true;
            submit_if_done();
        });
        const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(search_str+" fax", resolve, reject, query_response,"query");
        });
        queryPromise.then(query_promise_then)
            .catch(function(val) {
            console.log("Failed at this queryPromise " + val);
        my_query.done.query=true;
            submit_if_done();
        });
    }

})();
