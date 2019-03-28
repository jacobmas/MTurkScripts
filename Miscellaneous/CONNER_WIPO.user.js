// ==UserScript==
// @name         CONNER_WIPO
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  maybe no wipo needed
// @author       You
// @include        http://*.mturkcontent.com/*
// @include        https://*.mturkcontent.com/*
// @include        http://*.amazonaws.com/*
// @include        https://*.amazonaws.com/*
// @include https://worker.mturk.com/*
// @include  https://www.wipo.int*
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
// @connect *
// @connect crunchbase.com
// @require https://raw.githubusercontent.com/hassansin/parse-address/master/parse-address.min.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/jacobsscriptfuncs.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/MTurkScript.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/LZString.js
// @resource GlobalCSS https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/globalcss.css
// ==/UserScript==

(function() {
    'use strict';
    var my_query = {};
    var bad_urls=[];
    var MTurk=new MTurkScript(30000,200,[],init_Query,"ANXJ0R5N8SZQA");
    var MTP=MTurkScript.prototype;
    function is_bad_name(b_name)
    {
        var lower_b=b_name.toLowerCase(),lower_my=my_query.name.toLowerCase();
        if(lower_b.indexOf(lower_my)!==-1) return false;
        return true;
    }

    function query_response(response,resolve,reject) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        console.log("in query_response\n"+response.finalUrl);
        var search, b_algo, i=0, inner_a;
        var b_url="crunchbase.com", b_name, b_factrow,lgb_info, b_caption,p_caption;
        var b1_success=false, b_header_search,b_context,parse_context,inner_li,result;
        try
        {
            search=doc.getElementById("b_content");
            b_algo=search.getElementsByClassName("b_algo");
            lgb_info=doc.getElementById("lgb_info");
            b_context=doc.getElementById("b_context");
            if(b_context) { parse_context=MTP.parse_b_context(b_context); console.log("parse_context="+JSON.stringify(parse_context));
                          if(parse_context && parse_context.Title && /Wine/i.test(my_query.type) &&
                            !(parse_context.Wikipedia && !/en\.wikipedia\.org/.test(parse_context.Wikipedia))) {
                              resolve(parse_context.Title); return; }

                          }
            console.log("b_algo.length="+b_algo.length);
            for(i=0; i < b_algo.length; i++)
            {
                b_name=b_algo[i].getElementsByTagName("a")[0].textContent;
                b_url=b_algo[i].getElementsByTagName("a")[0].href;
                b_caption=b_algo[i].getElementsByClassName("b_caption");
                p_caption="";
                if(b_caption.length>0 && b_caption[0].getElementsByTagName("p").length>0) {
                    p_caption=b_caption[0].getElementsByTagName("p")[0].innerText;
                }
                console.log("("+i+"), b_name="+b_name+", b_url="+b_url+", p_caption="+p_caption);
                if(b_url.indexOf("wine-searcher.com")!==-1 &&
                   b_name.indexOf("Winery Information Page")!==-1) {
                    console.log("Woo");
                    resolve(b_name.replace(/\s-.*$/,""));
                    return; }
                if(result=check_sites(b_algo[i],b_name,b_url,p_caption)) {
                    console.log("MOO");
                    resolve(result);
                    return;
                }



            }
            
        }
        catch(error)
        {
            reject(error);
            return;
        }
        reject("Nothing found");
        //        GM_setValue("returnHit",true);
        return;

    }

    /* Check various useful info in search */
    function check_sites(b_algo,b_name,b_url,p_caption) {
        var b_factrow,inner_li,i;
        var reg=/(?:Manufacturer|Parent[^\:]+|Owner):\s*(.*)$/,match;
        console.log("in check sites "+b_name+", "+b_url);
        if(/en\.wikipedia\.org/.test(b_url) && (b_factrow=b_algo.getElementsByClassName("b_factrow")).length>0 &&
           (inner_li=b_factrow[0].getElementsByTagName("li"))) {
            for(i=0;i < inner_li.length; i++) {
                if(match=inner_li[i].innerText.match(reg)) return match[1];
            }
        }
        else if(/vivino\.com\/wineries\//.test(b_url) && /\| Winery/.test(b_name)) return b_name.replace(/\|.*$/,"").trim();
        return null;
    }

    /* Search on bing for search_str, parse bing response with callback */
    function query_search(search_str, resolve,reject, callback) {
        console.log("Searching with bing for "+search_str);
        var search_URIBing='https://www.bing.com/search?q='+
            encodeURIComponent(search_str)+"&first=1&rdr=1";
        GM_xmlhttpRequest({method: 'GET', url: search_URIBing,
                           onload: function(response) { callback(response, resolve, reject); },
                           onerror: function(response) { reject("Fail"); },
                           ontimeout: function(response) { reject("Fail"); }
                          });
    }

    /* Following the finding the district stuff */
    function query_promise_then(result) {
        my_query.fields.producer=result;

        submit_if_done();
        

    }

    function begin_script(timeout,total_time,callback) {
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

        my_query.fields.producer=MTP.shorten_company_name(my_query.fields.producer);
         var ctrl=document.getElementsByClassName("form-control"),i;
        ctrl[0].value=my_query.fields.producer;
       // for(x in my_query.fields) if(field=document.getElementById(x)) field.value=my_query.fields[x];
    }

    function submit_if_done() {
        var is_done=true,x;
        add_to_sheet();
        
        if(my_query.fields.producer.length>0 && !my_query.submitted && (my_query.submitted=true)) MTurk.check_and_submit();
    }



    function init_wipo(doc,url,resolve,reject,response) {
        console.log(response);
        var scripts=doc.scripts,i,script_reg=/^\s*var login/,zk_reg=/zk\s*\=\s*\"([^\"]*)/;//\"([^\"])\"/;
        var zk_match;
        for(i=0;i<scripts.length;i++) {
            if(script_reg.test(scripts[i].innerHTML)) {

                //console.log("scripts["+i+"].innerHTML="+scripts[i].innerHTML);
                zk_match=scripts[i].innerHTML.match(zk_reg);
                if(zk_match) { my_query.wipo.qk=zk_match[1]; break; }

            }
        }
        if(my_query.wipo.qk) {
            start_wipo(doc,url,resolve,reject);


        }
        else { console.log("No qk found"); }


    }
  
    function getRndInteger(min, max) {
        return Math.floor(Math.random() * (max - min + 1) ) + min;
    }
    function getRndDigitString(len) {
        var ret="",i;
        for(i=0;i<len;i++) {
            ret+=(getRndInteger(0,9)).toString();
        }
    }
    function getRndHexString(len) {
        var ret="",i;
        for(i=0;i<len;i++) {
            ret+=get_hex(getRndInteger(0,15)).toString();
        }
    }
    function get_hex(num) {
        var map={0:0,1:1,2:2,3:3,4:4,5:5,6:6,7:7,8:8,9:9,10:"A",11:"B",12:"C",13:"D",14:"E",15:"F"};
        if(map[num]) return map[num];
        return "";
    }



    function start_wipo(doc,url,resolve,reject) {
        var headers={"Host":"www.wipo.int","Origin":"https://www.wipo.int","Referer":"https://www.wipo.int/branddb/en/",
                     "X-Requested-With":"XMLHttpRequest",
                    "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                    "Cookie":"JSESSIONID=8733197D706CB99BF40A9430044AC359; BSWA=balancer.bswa1; _ga=GA1.2.1440234544.1544622492; _gid=GA1.2.1946041073.1544622492; wipo_language=en; auth_amplbcookie=.wipoamp4; ABIW=balancer.cms41; _gat_UA-138270-1=1; _gat=1; _gat_UA-138270-24=1"};

        var data={"p":{"search":{"sq":[{"te":my_query.name,"fi":"BRAND"},{"te":my_query.type,"fi":"GS","df":"GS"}]}},
                  "s":{"dis":"flow"},"type":"brand","la":"en","qi":"0-"+my_query.wipo.qk,
                  "queue":1,"_":"8317"};
        //data={"type":"brand","la":"en","qi":"0-"+my_query.wipo.qk,"queue":1,"_":"8403"};
       // console.log("data="+JSON.stringify(data));
        var qz_str=LZString.compressToBase64(JSON.stringify(data));
        var data_str="qz="+qz_str.replace(/\s/g,"+");
       // console.log("data_str="+data_str);
        GM_xmlhttpRequest({method: 'POST',url: "https://www.wipo.int/branddb/jsp/select.jsp",data:data_str,headers:headers,
                           onload: function(response) {
                               var x;
                               for(x in response) { console.log("response["+x+"]="+response[x]); }
                               var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");

                               start_wipo2(response,resolve,reject); },
                           onerror: function(response) { reject("Fail wipo"); },
                           ontimeout: function(response) { reject("Fail wipo"); }
                          });
    }
    function start_wipo2(response,resolve,reject) {

        var headers={"Host":"www.wipo.int","Origin":"https://www.wipo.int","Referer":"https://www.wipo.int/branddb/en/",
                     "X-Requested-With":"XMLHttpRequest",
                    "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                    "Cookie":"JSESSIONID=8733197D706CB99BF40A9430044AC359; BSWA=balancer.bswa1; _ga=GA1.2.1440234544.1544622492; _gid=GA1.2.1946041073.1544622492; wipo_language=en; auth_amplbcookie=.wipoamp4; ABIW=balancer.cms41; _gat_UA-138270-1=1; _gat=1; _gat_UA-138270-24=1"};

//        {"p":{"search":{"sq":[{"te":"WALNUT CREST","fi":"BRAND"},{"te":"wine","fi":"GS","df":"GS"}]}},"s":{"dis":"flow"},"type":"brand","la":"en","qi":"1-L4Pi4Qv3jFTEiweFkSIcOlWDYhRXXIYVwtzxokuNfz8=","queue":1,"_":"8403"}
        var data={"p":{"search":{"sq":[{"te":my_query.name,"fi":"BRAND"},{"te":my_query.type,"fi":"GS","df":"GS"}]}},
                  "s":{"dis":"flow"},"type":"brand","la":"en","qi":"1-"+my_query.wipo.qk,
                  "queue":1,"_":"8403"};
        //data={"type":"brand","la":"en","qi":"0-L4Pi4Qv3jFTEiweFkSIcOlWDYhRXXIYVwtzxokuNfz8=","queue":1,"_":"8403"};
    //    console.log("data="+JSON.stringify(data));
        var qz_str=LZString.compressToBase64(JSON.stringify(data));
        var data_str="qz="+qz_str.replace(/\s/g,"+");
      //  console.log("data_str="+data_str);
        GM_xmlhttpRequest({method: 'POST',url: "https://www.wipo.int/branddb/jsp/select.jsp",data:data_str,headers:headers,
                           onload: function(response) {
                               var x;
                              for(x in response) { console.log("response["+x+"]="+response[x]); }
                               var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");

                               parse_wipo(response,resolve,reject); },
                           onerror: function(response) { reject("Fail wipo"); },
                           ontimeout: function(response) { reject("Fail wipo"); }
                          });
    }

    function parse_wipo(response,resolve,reject) {
        //console.log("doc.body.innerHTML="+response.responseText);
        var parsed;
        try
        {


            parsed=JSON.parse(response.responseText);
        }
        catch(error) { console.log("Error = "+error+", response.responseText="+response.responseText); resolve([]); }
        if(parsed && parsed.response && parsed.response.docs) resolve(parsed.response.docs);
        else if(parsed) { console.log("text="+response.responseText); resolve([]); }

    }

    function done_wipo(result) {
        var ctrl=document.getElementsByClassName("form-control"),i;
        for(i=0; i < result.length;i++) {
            console.log("result["+i+"]="+JSON.stringify(result[i]));
            if(result[i].BRAND && result[i].BRAND.length && result[i].BRAND.length>0) result[i].BRAND=result[i].BRAND[0];
            if(result[i].HOL_RU && !result[i].HOL) result[i].HOL=result[i].HOL_RU;
            if(result[i].HOL) break; }

//
        if(i < result.length && (result[i].score>0.4 ||
                                 (result[i].BRAND && my_query.name.toLowerCase().indexOf(result[i].BRAND.replace(/^([^\s]+\s[^\s]+)\s.*$/,"$1").
                                                                                         toLowerCase().trim())===0))
                                 && result[i].HOL) {
         //   console.log("result="+JSON.stringify(result[i]));
            if(result[i].HOL.length && result[i].HOL.length>0) result[i].HOL=result[i].HOL[0];
            my_query.fields.producer=result[i].HOL.replace(/(Inc\.).*$/,"$1").replace(/\n.*$/,"");
            submit_if_done();
        }

        else {
            console.log("NO good found in result, result.length="+result.length);
            begin_query_stuff();

        }
    }

    function begin_query_stuff() {
        var search_str=my_query.name;
        if(/Wine/i.test(my_query.type)) search_str=search_str+" winery";
        else if(/Beer/i.test(my_query.type)) search_str=search_str+" brewery";
        else search_str=search_str+" liquor";
        const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(search_str, resolve, reject, query_response);
        });
        queryPromise.then(query_promise_then)
            .catch(function(val) {
            console.log("Failed at this queryPromise " + val); GM_setValue("returnHit",true); });
    }

    function begin_wipo_stuff() {
        var ctrl=document.getElementsByClassName("form-control");
        
        if(/(Winery|Vineyards|Company)/i.test(my_query.name)) {
            console.log("MOO");
            my_query.fields.producer=my_query.name.replace(/(Winery|Vineyards|Company).*/i,"$1");
           submit_if_done(); return; }
        var headers={"Cookie":"JSESSIONID=A62182C627CB433DF7157D59F9F58C03; BSWA=balancer.bswa1; _gat=1","host":"www.wipo.int"};
        var promise=new Promise((resolve,reject) => {
        GM_xmlhttpRequest({method: 'GET', url: "https://www.wipo.int/branddb/en/",headers,
                           onload: function(response) {
                               var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
                               init_wipo(doc,response.finalUrl, resolve, reject,response); },
                           onerror: function(response) { reject("Fail"); },
                           ontimeout: function(response) { reject("Fail"); }
                          });
        }).then(done_wipo).catch(MTP.my_catch_func);
   //     var promise=MTP.create_promise("https://www.wipo.int/branddb/en/",init_wipo,done_wipo,MTP.my_catch_func);
    }

    function init_Query()
    {
        var x;
        var y=unsafeWindow;
        console.log(y);
      /*  for(x in y) { console.log("x="+x);
                    try { console.log(y[x]); }
                     catch(error) {  console.log("error="+error); }
    }*/
        var ctrl=document.getElementsByClassName("form-control"),i;
        console.log("in init_query");
        var fixed=LZString.decompressFromBase64("N4IgDiBcoM4KYEMBOBjAFlWBHKBtUALnFCAOoCCAMgHICqAKgAQDCASgKIDK9IANCADMAliQBCrctQAiIAL69CxSCADuQgHbF+wkgHFOfEABMBeg7IC6s+SBiZjQu8oEAbAPYq5/AgE8wSkAAjJAR1I0MXBBI4dUMsEWUARgBaSgAWAAUhNIBFADcAZgArADF6diEVOBKAa04ASRQAeRdSKQBNNFYADW769oA1FQIALwAPNxqAV2oBEYAOAF44qbhVqET+AH0SebSABgK5IAAA==");
        console.log("fixed="+fixed);
        var wT=document.getElementById("workContent").getElementsByTagName("table")[0];
        //var dont=document.getElementsByClassName("dont-break-out");
        my_query={name:wT.rows[0].cells[1].innerText,type:wT.rows[1].cells[1].innerText,
                  fields:{producer:""},done:{},submitted:false,wipo:{}};
        if(/LIQUOR/.test(my_query.type)) my_query.type="Alcoholic beverages";


        begin_script(200,0,begin_wipo_stuff);
        
    }
    if(window.location.href.indexOf("wipo.int")!==-1) {
    //    var bob=getRndDigitString(10);
  //      bob=getRndDigitString(10);
//        console.log("document.cookie="+document.cookie);
       // window.document.cookie="";
        /*setTimeout(function() { document.cookie="";         console.log("document.cookie="+document.cookie);
 }, 500);
      console.log("document.cookie="+document.cookie);*/

    }

})();