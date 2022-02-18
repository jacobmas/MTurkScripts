// ==UserScript==
// @name        AV CO
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  New script
// @author       You
// @include        http://*.mturkcontent.com/*
// @include        https://*.mturkcontent.com/*
// @include        http://*.amazonaws.com/*
// @include        https://*.amazonaws.com/*
// @include https://worker.mturk.com/*
// @include https://order.suddenlink.com/*
// @include https://order.optimum.com/*
// @include https://*.spectrum.com/*
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
// @grant unsafeWindow

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
    let toKeep=['_GRECAPTCHA','auth_token'];

    /* TODO should be requester #, last field should be if it's crowd or not */
    var MTurk=new MTurkScript(200000,1000+(Math.random()*250),[],begin_script,"AH8CFT48C3HWL",false);
    var MTP=MTurkScript.prototype;
    console.log("window.location.href=",window.location.href);
    if(/Buyflow\/Storefront/.test(window.location.href)) {
        // deleteAllCookies();
        //deleteGMCookies(toKeep);
        GM_addValueChangeListener("my_query",function() {
            my_query=arguments[2];
            console.log("my_query=",my_query);
            var fields=["streetAddress","apartment","city","state","zipCode"];
            var field_map={"streetAddress":"address","city":"city","state":"state","zipCode":"zip","apartment":"apartment"};
            var x,temp;
            for(x of fields) {
                temp=document.querySelector("#"+x);
                console.log("x=",x+", my_query["+x+"]=",my_query[x]);
                console.log("temp=",temp);
                temp.value=my_query[field_map[x]]||"";
                // setTimeout(function() { document.querySelector(".btn").click(); }, 1000);
            }
            document.querySelector("#streetAddress").value=my_query.address;//+", "+my_query.city;
            document.querySelector("#apartment").value=my_query.apartment.replace(/^((APT|UNIT) )/,"");
            document.querySelector("#city").value=my_query.city;
            document.querySelector("#state").value=my_query.state;

            document.querySelector("#zipCode").value=my_query.zip;

            var el_list=['#city','#streetAddress','#state','#zipCode',"#apartment"];
            var curr_el;
            for(curr_el of el_list) {
                let e = new Event("change");

                let element = document.querySelector(curr_el);
                console.log("element=",element);
                element.dispatchEvent(e);
            }

            setTimeout(function() { document.querySelector(".btn").click(); }, 500);



        });


    }
    if(/Buyflow\/AddressSelection/.test(window.location.href)) {
        deleteAllCookies();
        // deleteGMCookies(toKeep);
        setTimeout(function() { window.location.href="https://order.suddenlink.com/Buyflow/Storefront"; GM_setValue("returnHit",true); },500);


        // setTimeout(parse_address_selection,100,0);




    }

    function parse_address_selection(counter) {
        var rad=document.querySelectorAll(".radio-button");
        console.log("rad=",rad);
        if(rad.length===0 && counter<50) {
            setTimeout(parse_address_selection,100,counter+1);
            return;
        }
        rad[rad.length-1].click();
        setTimeout(function() { document.querySelector(".btn").click(); }, 500);
    }

    if(/Buyflow\/Products/.test(window.location.href)) {
        deleteAllCookies();
        //  deleteGMCookies(toKeep);
        setTimeout(parse_page,1000,0);
    }
    if(/Buyflow\/No(Service|.*Offers)/.test(window.location.href)) {
        deleteAllCookies()
        //                deleteGMCookies(toKeep);
        setTimeout(function() { window.location.href="https://order.suddenlink.com/Buyflow/Storefront"; GM_setValue("returnHit",true); },500);

        // GM_setValue("result",{card:null,price:null,max_speed:0,date:Date.now()});
        //setTimeout(function() { window.location.href="https://order.suddenlink.com/Buyflow/Storefront"; },500);
    }

    if(/spectrum\.com\/multiple-unit/.test(window.location.href)) {
        console.log("Multiple unit");
        deleteAllCookies();
               deleteGMCookies();

        GM_setValue("returnHit",true); // Don't risk rejection

        return;
    }
    else if(/spectrum\.com/.test(window.location.href)) {
        deleteAllCookies();
        console.log("Setting value change, window.location.href=",window.location.href);
        GM_addValueChangeListener("moo",function() {
            console.log("moo=",arguments[2]);
        }
                                 );
        GM_addValueChangeListener("begin_params",function() {
            console.log("begin_params=",arguments[2]);
            window.location.href=arguments[2].url;



        });
        setTimeout(parse_spectrum,500,0);
    }
    if(/mturkcontent.com/.test(window.location.href)) {


        init_Query();
    }

    function parse_spectrum(counter) {
        console.log("window.location.href=",window.location.href);
        // GM_cookie.list details supports url, domain, name and path


        if(/spectrum\.com\/multiple-unit/.test(window.location.href)) {
            console.log("Multiple unit");
            deleteAllCookies();
          //  unsafeWindow.localStorage.clear();
           // unsafeWindow.sessionStorage.clear();
                    deleteGMCookies([],true);
            GM_setValue("returnHit",true);
//            GM_setValue("results",{date:Date.now(),"service_available":"Address could not be confirmed","max_speed":0});

            return;
        }

        var my_button=document.querySelector("button[data-linkname='view_offers']");
        var bulk_message=document.querySelector(".bulk-support-message");
        var no_house=document.querySelector(".buyflow-house-not-found");
        var h1=document.querySelector("h1");
        if(h1 && /Access Denied/i.test(h1.innerText.trim())) {
            console.log("Access denied!!!!!");
            var arrayOfCookies = GM_cookie("list");
            console.log("arrayOfCookies=",arrayOfCookies);
            deleteAllCookies();
            unsafeWindow.localStorage.clear();
            unsafeWindow.sessionStorage.clear();

            deleteGMCookies([],true);
            setTimeout(function() { window.location.reload(); }, 6000);
            return;
            //window.location.reload();
        }
        if(/\/buy\/featured/.test(window.location.href)) {
            console.log("Buy featured");
            var features=document.querySelectorAll(".feature-offer");
            if(features.length>0) {
                setTimeout(parse_features,500,features);
                return;
            }
            else {
                setTimeout(parse_spectrum,200,counter+1);
                return;
            }
        }
        if(/\/localization-error/.test(window.location.href)) {
            console.log("localization error");
            deleteAllCookies();
            unsafeWindow.localStorage.clear();
            unsafeWindow.sessionStorage.clear();
                    deleteGMCookies([],true);

            GM_setValue("returnHit",true);

            return;
        }
        if(!my_button && !bulk_message && !no_house && counter < 125) {
            console.log("reloading");
            setTimeout(parse_spectrum,200,counter+1);
            return;
        }
        else if(bulk_message) {
            console.log("Found bulk message");
            deleteAllCookies();
            unsafeWindow.localStorage.clear();
                    deleteGMCookies([],true);
            GM_setValue("returnHit",true);

          //  GM_setValue("results",{date:Date.now(),"service_available":"no","max_speed":0});

            return;
        }
        else if(no_house) {
            console.log("Found no house");
            deleteAllCookies();
            unsafeWindow.localStorage.clear();
                    deleteGMCookies([],true);

                        GM_setValue("returnHit",true);

           // GM_setValue("results",{date:Date.now(),"service_available":"Address could not be confirmed","max_speed":0});

            return;
        }
        else if(my_button) {
            console.log("Found my_button");
            my_button.click();
        }
        else {
            GM_setValue("returnHit",true);

            return;
        }
    }
    function deleteGMCookies(toKeep, deleteAll) {
        GM_cookie.list({ url: 'spectrum.com' }, function(cookies, error) {
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
    function parse_page(counter) {
        console.log("Parsing page");
        var result={};
        var cards=document.querySelectorAll(".internet-offers .product-card");
        var card,match;
        var best_card=null;
        var max_mbps=0;
        var speed_re=/Up to ([\d,]+) ([A-Z]{1}bps)/;
        if(cards.length===0 && counter < 20) {
            setTimeout(parse_page,100,counter+1);
            return;
        }
        for(card of cards) {
            let label_text=card.querySelector("label").innerText.trim();
            match=label_text.match(speed_re);
            if(match) {
                console.log("label_text=",label_text," match=",match);
                let temp_speed=parseInt(match[1].replace(/,/g,""));
                if(match[2].toLowerCase()==='gbps') temp_speed*=1000;
                if(temp_speed>max_mbps) {
                    max_mbps=temp_speed;
                    best_card=card;
                }
            }
        }
        /*var last=cards[cards.length-1];
        console.log("last=",last);
        var h3=last.querySelector(".card-heading").innerText;

        var speed=last.querySelector("label");
        var price=last.querySelector(".price").innerText.replace(/[^0-9\.]/g,"");*/
        GM_setValue("result",{card:best_card,max_speed:max_mbps,date:Date.now()});
        setTimeout(function() { window.location.href="https://order.suddenlink.com/Buyflow/Storefront"; },100);
    }


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
        try
        {
            search=doc.getElementById("b_content");
            b_algo=doc.querySelectorAll("#b_results > .b_algo");
            lgb_info=doc.getElementById("lgb_info");
            b_context=doc.getElementById("b_context");
            var mtle=doc.querySelector("#mt_tleWrp");
            if(mtle) {
                let add_text=mtle.innerText.trim().replace(/^([^,]*)/,my_query.original_address);
                console.log("add_text=",add_text);
                let add=new Address(add_text);
                my_query.address=add.address1;
                my_query.apartment=add.address2;
                my_query.city=add.city;
                my_query.state=add.state;
                resolve("");
                return;

            }



            console.log("b_algo.length="+b_algo.length);
            if(b_context&&(parsed_context=MTP.parse_b_context(b_context))) {
                console.log("parsed_context="+JSON.stringify(parsed_context));
                let temp_address=parsed_context.SubTitle==='House'?parsed_context.Title:"";
                if(parsed_context.Address) temp_address=parsed_context.Address;
                if(temp_address) {
                    let add=new Address(temp_address.replace(/^([^,]*)/,my_query.original_address));
                    console.log("add=",add);
                    my_query.address=add.address1;
                    my_query.apartment=add.address2;

                    my_query.city=add.city;
                    my_query.state=add.state;
                    resolve("");
                    return;
                }

            }
            if(lgb_info&&(parsed_lgb=MTP.parse_lgb_info(lgb_info))) {
                console.log("parsed_lgb="+JSON.stringify(parsed_lgb));
                let add=new Address(parsed_lgb.address.replace(/^([^,]*)/,my_query.original_address));
                console.log("add=",add);
                my_query.address=add.address1;
                my_query.apartment=add.address2;

                my_query.city=add.city;
                my_query.state=add.state;
                resolve("");
                return;

            }


            for(i=0; i < b_algo.length&&i<2; i++) {
                b_name=b_algo[i].querySelector("h2 a").textContent;
                b_url=b_algo[i].getElementsByTagName("a")[0].href;
                b_caption=b_algo[i].getElementsByClassName("b_caption");
                p_caption=(b_caption.length>0 && b_caption[0].getElementsByTagName("p").length>0) ?
                    p_caption=b_caption[0].getElementsByTagName("p")[0].innerText : (b_algo[i].querySelector("p")? b_algo[i].querySelector("p").innerText.trim():"");
                console.log("("+i+"), b_name="+b_name+", b_url="+b_url+", p_caption="+p_caption);
                if(/zillow\.com/.test(b_url)) {
                    let add=new Address(b_name.replace(/\s\|.*$/,"").replace(/^([^,]*)/,my_query.original_address));
                    console.log("add=",add);

                    if(add.postcode===my_query.zip) {
                        my_query.address=add.address1;
                        my_query.apartment=add.address2;

                        my_query.city=add.city;
                        my_query.state=add.state;
                        b1_success=true;
                        break;
                    }
                }
            }
            if(b1_success && (resolve(b_url)||true)) return;
        }
        catch(error) {
            reject(error);
            return;
        }
        resolve("");
        return;
    }
    function do_next_query(resolve,reject,type) {
        reject("Nothing found");
    }


    function parse_spectrum_then() {
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
        console.log("my_query=",my_query);
        try {
            var parsed_add=new Address(my_query.original_address);

            console.log("parsed_add=",parsed_add);
        }
        catch(e) { console.log("e=",e); }
        if(!my_query.city||!my_query.state) {
            GM_setValue('returnHit',true);
            return;
        }
        GM_addValueChangeListener("result",function() {
            console.log(arguments);
            if(!arguments[2].card) {
                document.querySelectorAll("[name='service_available']")[1].click();
                my_query.fields.max_speed=0;

            }
            else {
                my_query.fields.max_speed=arguments[2].max_speed;

                /*                if(/1 gig/i.test(arguments[2].card)) { my_query.fields.max_speed=1000;
//                    document.querySelector("#internet_max_speed_range").value="over_500";
                }
                else if(/15(\s|$)/i.test(arguments[2].card)) { my_query.fields.max_speed=15; }
                else if(/150$/i.test(arguments[2].card)) my_query.fields.max_speed=150;*/

                document.querySelectorAll("[name='service_available']")[0].click();
            }
            submit_if_done();
        });
        GM_setValue("my_query",my_query);
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
            if((field=document.getElementsByName(x)[0])) field.value=my_query.fields[x];
        }
    }

    function submit_if_done() {
        var is_done=true,x,is_done_dones=x;
        add_to_sheet();
        for(x in my_query.done) if(!my_query.done[x]) is_done=false;
        is_done_dones=is_done;
        for(x in my_query.fields) {
            console.log(`my_query.fields[${x}]=${my_query.fields[x]}`);

            if(!my_query.fields[x]&&my_query.fields[x]!=0) is_done=false;
        }
        if(is_done && !my_query.submitted && (my_query.submitted=true)) {
            if(document.querySelector("crowd-button") && GM_getValue("automate",false)) {
                setTimeout(function() { document.querySelector("crowd-button").click(); }, 50); }
            else {
                MTurk.check_and_submit(); }
        }
        else if(is_done_dones) {
            console.log("Failed to find all fields");
            GM_setValue("returnHit",true);
        }
    }

    function init_Query()
    {
        console.log("unsafeWindow=",unsafeWindow);
        console.log("in init_query");
        var i;
        var wT=document.getElementById("workContent").getElementsByTagName("table")[0];
        // var dont=document.getElementsByClassName("dont-break-out");

        var a=document.querySelector("crowd-form li a");
        console.log("a=",a);

        my_query={domain:MTP.get_domain_only(a.href,true),name,apartment:"",date:Date.now(),address:wT.rows[0].cells[1].innerText.trim(),zip:wT.rows[1].cells[1].innerText.trim(),
                  fields:{},done:{},
                  try_count:{"query":0},
                  submitted:false};
        my_query.original_address=my_query.address;
        while(my_query.zip.length<5) my_query.zip="0"+my_query.zip;
        if(/suddenlink\.com/.test(my_query.domain)) {
            const queryPromise = new Promise((resolve, reject) => {
                console.log("Beginning URL search");
                query_search(my_query.address+", "+my_query.zip, resolve, reject, query_response,"query");
            });
            queryPromise.then(query_promise_then)
                .catch(function(val) {
                console.log("Failed at this queryPromise " + val); GM_setValue("returnHit",true); });
            return;
        }




        console.log("my_query="+JSON.stringify(my_query));
        if(/spectrum\.com/.test(my_query.domain)) {

            GM_addValueChangeListener("results",function() {
                console.log("results=",arguments[2]);
                if(arguments[2].service_available==="yes") {
                    document.querySelectorAll("[name='service_available']")[0].click();
                }
                else if(arguments[2].service_available==="no") {
                    document.querySelectorAll("[name='service_available']")[1].click();
                }
                else if(arguments[2].service_available==="Address could not be confirmed") {
                    document.querySelectorAll("[name='service_available']")[2].click();
                }
                else {
                    GM_setValue("returnHit",true);
                    return;
                }



                //                 my_query.fields.service_available=
                my_query.fields.max_speed=arguments[2].max_speed;
                submit_if_done();
            });
            var url=`https://location.spectrum.com/localization?zip=${my_query.zip}&a=${my_query.address.replace(/\s/g,"+")}&serviceVendorName=twc&v=ORG&omnitureId=d1d8582b-0f7b-4e8a-9246-4b3235fb80ac`;
            console.log("url=",url);
            GM_setValue("begin_params",{"url":url,"date":Date.now()});
            GM_setValue("moo",Date.now());
            //var promise=MTP.create_promise(url,parse_spectrum,parse_spectrum_then,function() { });
        }
        /*     var search_str;
        const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(search_str, resolve, reject, query_response,"query");
        });
        queryPromise.then(query_promise_then)
            .catch(function(val) {
            console.log("Failed at this queryPromise " + val); GM_setValue("returnHit",true); }); */
    }

})();