// ==UserScript==
// @name         Geoff Lillienfeld
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Logo and brand colors
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
    var bad_urls=['.realtor.com','.metrolistmls.com','.zillow.com','.homes.com','/licensee.io','.primelocation.com','/reainusa.com','.homelight.com','.redfin.com',
                 '.listingup.com','.ramseysolutions.com','.har.com','.topagentsranked.com','hometownrealestateco.com','.residential.com','nystatemls.com','mls.com/profiles',
                 '.peerreputation.com','.realestatefind.info','.residential.com','/agreatertown.com','.xome.com','.compass.com','/agent-tx.org/','.houzz.com',
                 '.utahrealestate.com','.realsatisfied.com'];
    /* TODO should be requester #, last field should be if it's crowd or not */
    var MTurk=new MTurkScript(45000,500+(Math.random()*100),[],begin_script,"A6LRQ8R1V0DI5",true);
    var MTP=MTurkScript.prototype;
    function is_bad_name(b_name)
    {
        return false;
    }

    function query_response(response,resolve,reject,type) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        console.log("in query_response\n"+response.finalUrl+", type="+type);
        var search, b_algo, i=0, inner_a;
        var b_url="crunchbase.com", b_name, b_factrow,lgb_info, b_caption,p_caption;
        var b1_success=false, b_header_search,b_context,parsed_context,parsed_lgb;
        var my_re=new RegExp("like "+my_query.name+" of (.*)","i");
        console.log("my_re=",my_re);
        try
        {
            search=doc.getElementById("b_content");
			b_algo=doc.querySelectorAll("#b_results > .b_algo");
            lgb_info=doc.getElementById("lgb_info");
            b_context=doc.getElementById("b_context");
            console.log("b_algo.length="+b_algo.length);
	    if(b_context&&(parsed_context=MTP.parse_b_context(b_context))) {
                console.log("parsed_context="+JSON.stringify(parsed_context));
            if(my_query.company && parsed_context.url&&!MTP.is_bad_url(parsed_context.url,bad_urls,-1)) {
                resolve(parsed_context.url);
                return;
            }
        }
            if(lgb_info&&(parsed_lgb=MTP.parse_lgb_info(lgb_info))) {
                    console.log("parsed_lgb="+JSON.stringify(parsed_lgb)); }
            for(i=0; i < b_algo.length; i++) {
                b_name=b_algo[i].querySelector("h2 a").textContent;
                b_url=b_algo[i].getElementsByTagName("a")[0].href;
                b_caption=b_algo[i].getElementsByClassName("b_caption");
                p_caption=(b_caption.length>0 && b_caption[0].getElementsByTagName("p").length>0) ?
                    p_caption=b_caption[0].getElementsByTagName("p")[0].innerText : (b_algo[i].querySelector("p")? b_algo[i].querySelector("p").innerText.trim():"");
                console.log("("+i+"), b_name="+b_name+", b_url="+b_url+", p_caption="+p_caption);
                if(i<3 && !MTP.is_bad_url(b_url,bad_urls,-1) &&
                   ((my_query.company&&!MTurkScript.prototype.is_bad_name(b_name,my_query.company,p_caption,i)) ||!MTurkScript.prototype.is_bad_name(b_name,my_query.name,p_caption,i))
		   && (b1_success=true)) break;
                if(i<2 && /facebook\.com/.test(b_url) && !my_query.fb_url&& (new RegExp(my_query.name).test(b_name)||new RegExp(my_query.name).test(p_caption)) ) {
                    my_query.fb_url=b_url.replace(/(facebook\.com\/[^\/]*).*$/,"$1");
                                        console.log("Found fb=",my_query.fb_url);

                }
                if(i<3&&/realtor\.com/.test(b_url)) {
                    my_query.realtor_url=b_url;
                }
                if(i<3&&/zillow\.com/.test(b_url)) {
                    let match=p_caption.match(my_re);
                    console.log("match=",match);

                    if(match&&my_query.try_count[type]<2) {
                        my_query.company=match[1];
                        my_query.try_count[type]+=1;
                        query_search(my_query.company, resolve, reject, query_response,"query");
                        return;

                    }
                }
            }
            if(b1_success && (resolve(b_url)||true)) return;
        }
        catch(error) {
            reject(error);
            return;
        }
        if(my_query.fb_url) {
            let promise=MTP.create_promise(my_query.fb_url,MTP.parse_FB_home,parse_fb_then,function() {
GM_setValue("returnHit",true); },{resolve:resolve,reject:reject});
            return;
        }
        else if(my_query.try_count[type]===0 && my_query.realtor_url) {
             my_query.try_count[type]++;
            let promise=MTP.create_promise(my_query.realtor_url,parse_realtor,parse_realtor_then,function() {
GM_setValue("returnHit",true); },{resolve:resolve,reject:reject});
            return;
        }


	do_next_query(resolve,reject,type);
        return;
    }
    function parse_fb_then(result) {
        console.log("result=",result);
        if(result.url) {
            query_promise_then(result.url.replace(/\/\&.*$/,""));
            return;
        }
        GM_setValue("returnHit",true);
    }

    function do_next_query(resolve,reject,type) {
        if(my_query.try_count[type]===0) {
            my_query.try_count[type]++;
                            query_search(my_query.name+" real estate agent site:facebook.com" , resolve, reject, query_response,"query");

            return;
        }
        reject("Nothing found");
    }


    function parse_realtor(doc,url,resolve,reject,extra) {
        console.log("doc=",doc);
        //console.log(doc.body.innerHTML);
        var scripts=doc.scripts;
        var x;
        var temp;
        for(x of scripts) {
            if(/https:\/\/schema.org/.test(x.innerHTML)) {
                console.log(x.innerHTML);
                let parsed=JSON.parse(x.innerHTML);
                console.log("parsed=",parsed);
                if(parsed.length>0 && parsed[0].address&&parsed[0].subOrganization&&parsed[0].subOrganization.name
                  &&parsed[0].address.addressLocality&&parsed[0].address.addressRegion) {
                    my_query.company=parsed[0].subOrganization.name;
                    my_query.city=parsed[0].address.addressLocality;

                    my_query.state=parsed[0].address.addressRegion;
                     query_search(my_query.company+" "+my_query.city+" "+my_query.state , extra.resolve, extra.reject, query_response,"query");
                    return;
                }

            }
        }
        var result={};
        var new_url=doc.querySelector("#contact-details a[href^='http']");
        if(new_url) {
            resolve(new_url);
            return;
        }
        reject("");
    }

    function parse_realtor_then(result) {
        query_promise_then(result);
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
            var promise=MTP.create_promise(my_query.url,find_logo,submit_if_done,function() {
                if(!my_query.failed_once&&my_query.old_url) {
                    my_query.failed_once=true;
                    const queryPromise = new Promise((resolve, reject) => {
                        console.log("Beginning URL search");
                        query_search(my_query.name+" real estate agent" , resolve, reject, query_response,"query");
                    });
                    queryPromise.then(query_promise_then)
                        .catch(function(val) {
                        console.log("Failed at this queryPromise " + val); GM_setValue("returnHit",true); });
                    return;
                }




                GM_setValue("returnHit",true); });

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
        else if(is_done_dones) {
            console.log("Failed to find all fields");
            GM_setValue("returnHit",true);
        }
    }

    function toDataURL(url, callback){
        var request={url:url,method:'GET',responseType:'blob'};

        request.onload = function(response){
            console.log("response=",response);
            var fr = new FileReader();

            fr.onload = function(){
                console.log("this=",this);
                callback(this.result);
            };

            fr.readAsDataURL(response.response); // async call
        };

        GM_xmlhttpRequest(request);
    }

    function is_too_gray(r,g,b, mod) {
        var product=(r-g)*(r-g)+(r-b)*(r-b)+(b-g)*(b-g);
        return product < 1200&&(r>=mod||g>=mod||b>=mod);
    }
    function parse_my_data(imagedata,resolve,reject) {
        var map=new Map();
        var x,i;
        var counter=0;
        var data=imagedata.data;
        console.log("Hello,data=",data);
        var COUNTER_LEN=3000;
        var ROUNDING_MOD=8;
        var rounded_map=new Map();
        for(i=0;i<data.length;i+=4) {

            var temp=[data[i]-data[i]%ROUNDING_MOD,data[i+1]-data[i+1]%ROUNDING_MOD,data[i+2]-data[i+2]%ROUNDING_MOD].toString();
            var unrounded_temp=[data[i],data[i+1],data[i+2]].toString();
            if(is_too_gray(data[i],data[i+1],data[i+2], ROUNDING_MOD)) continue;
            if(map.has(temp)) {
                map.set(temp,map.get(temp)+1);
                var rounded_temp=rounded_map.get(temp)
                //console.log("rounded_map.get(temp)=",rounded_map.get(temp), " typeof=",typeof(rounded_map.get(temp)));
                if(rounded_map.has(temp) && typeof(rounded_temp)==='object' && !rounded_map.get(temp).includes(unrounded_temp)) {
                             //       console.log("rounded_map.get(temp)=",rounded_map.get(temp));
                    rounded_temp.push(unrounded_temp);
                    rounded_map.set(temp,rounded_temp); }
            }
            else {
                map.set(temp,1);
                rounded_map.set(temp,[unrounded_temp]);
            }
            counter+=1;

        }

        console.log("map=",map);
         console.log("rounded_map=",rounded_map);
        var arr=Array.from(map);
        arr.sort(function(a,b)  { return b[1] - a[1]; });
        console.log("arr=",arr);

        if(arr.length>0 && rounded_map.has(arr[0][0]) && arr[0][1]>=200) {
            let temp=rounded_map.get(arr[0][0]);
            console.log("temp=",temp," ",Array.from(temp));
            let my_rgb=Array.from(temp)[0].split(",");
            console.log("my_rgb=",my_rgb," my_rgb[0]<=ROUNDING_MOD=",my_rgb[0]<=ROUNDING_MOD&&my_rgb[1]<=ROUNDING_MOD&&my_rgb[2]<=ROUNDING_MOD);
            my_query.fields.RGB=Array.from(temp)[0];
            if(my_rgb[0]<=ROUNDING_MOD&&my_rgb[1]<=ROUNDING_MOD&&my_rgb[2]<=ROUNDING_MOD &&
               arr.length>1) {
                console.log("Did it");
                temp=rounded_map.get(arr[1][0]);
                            my_query.fields.RGB=Array.from(temp)[0];
            }
            else if(my_rgb[0]<=ROUNDING_MOD&&my_rgb[1]<=ROUNDING_MOD&&my_rgb[2]<=ROUNDING_MOD && data[3]===0) {
                reject("");
                return;
            }
            resolve("");
            return;
        }
        reject("");
        console.log("arr=",arr);
    }

    function find_logo(doc,url,resolve,reject) {
        console.log("LOGO, url=",url);
         var logo_list=doc.querySelectorAll("img[id*='logo' i],img[src*='logo' i],img[data-src*='logo' i],img[class*='logo' i],img[alt*='logo' i],.logo img,[id*='logo'] img");
        var logo;
        var curr;
        for(curr of logo_list) {
            console.log("curr=",curr);
            if(/^data:/.test(curr.src)&&curr.dataset&&curr.dataset.src) curr.src=curr.dataset.src;
            if(curr.src&&!/^data:/.test(curr.src)) {
            logo=curr;
            break;
        }
                               }
        if(logo) {
                        console.log("logo.src=",logo.src);

            logo.src=MTP.fix_remote_url(logo.src,url);
            console.log("logo.src=",logo.src);
            my_query.fields.primaryLogo=logo.src;
            toDataURL(logo.src,function(dataURL)  {
              //  console.log("dataURL=",dataURL);
                                var img = new Image();
                var pos=document.querySelector("crowd-form div div  div div");
                pos.parentNode.insertBefore(img,pos);
                logo.src=dataURL;

                img.src=dataURL;

                img.onload=function() {


                    var canvas = document.createElement('canvas');
                    var context = canvas.getContext('2d');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    context.drawImage(img, 0, 0 );
                    var myData = context.getImageData(0, 0, img.width, img.height);
                    console.log("myData=",myData);

                    parse_my_data(myData,resolve,reject);

//                    resolve("");
                    return;
                }
            });
            return;
        }
        reject("");
    }

    function init_Query()
    {
        bad_urls=bad_urls.concat(default_bad_urls);
        console.log("in init_query");
        var span=document.querySelector("crowd-form span");
        span.parentNode.removeChild(span);
        var url=document.querySelector("crowd-form div div a").href;
        if(/mturkcontent\.com/.test(url)) url="";
        var p=document.querySelectorAll("crowd-form div div p")[1].innerText.trim();
        var email=p.match(/email address: ([^\s]*)/);
        var name=p.match(/google the following: \"([^\"]*)\"/);
        my_query={url:url,email:email?email[1]:"",name:name?name[1].replace(/real estate agent/,"").
                  replace(/[^A-Za-z\s]*/g,"").
                  trim():"",fields:{},done:{},
		  try_count:{"query":0},
		  submitted:false};
	console.log("my_query="+JSON.stringify(my_query));
        if(url) {
            my_query.old_url=url;
            query_promise_then(url);
        }
        else {

            const queryPromise = new Promise((resolve, reject) => {
                console.log("Beginning URL search");
                query_search(my_query.name+" real estate agent" , resolve, reject, query_response,"query");
            });
            queryPromise.then(query_promise_then)
                .catch(function(val) {
                console.log("Failed at this queryPromise " + val); GM_setValue("returnHit",true); });
        }
    }

})();