// ==UserScript==
// @name         Murtaza HaiderBusiness
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
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/Address.js

// @resource GlobalCSS https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/globalcss.css
// ==/UserScript==

(function() {
    'use strict';
    var my_query = {};
    var bad_urls=[];
    var MTurk=new MTurkScript(30000,1500+(Math.random()*750),[],begin_script,"A3KX2G8T7W541F",true);
    var MTP=MTurkScript.prototype;
    function is_bad_name(b_name)
    {
        return false;
    }
    function try_mt_list(doc,url,resolve,reject,parsed_lgb) {
        let mt_lst=doc.querySelectorAll(".mt_biz_link");
        var promise_list=[];
        var do_nearby=true;
        let y;
        if(mt_lst.length>0&&do_nearby) {
            my_query.found_nearby=true;
            for(y of mt_lst) {
                promise_list.push(make_addressplus_query(y.innerText.trim(),parsed_lgb.address)); }

            Promise.all(promise_list).then(function() {
                my_query.done.nearby=true;
                 submit_if_done();
                
            }).catch(function(response) {
                console.log("Failure in addressplus queries from try_mt_list "+response);
                  my_query.done.nearby=true;
                 submit_if_done();
                });
        }
        else {
            my_query.done.nearby=true;
            submit_if_done();
        }
        return mt_lst.length>0&&do_nearby&&false;
    }

    function is_good_initial_query(doc,url,resolve,reject) {
        var lgb_info=doc.querySelector("#lgb_info,#mt_tleWrp"),parsed_lgb;
        if(lgb_info&&(parsed_lgb=MTP.parse_lgb_info(lgb_info))) {
            if(parsed_lgb.url) parsed_lgb.url=MTP.fix_remote_url(parsed_lgb.url,url);
            if(parsed_lgb.url && /bing\.com\/maps/.test(parsed_lgb.url) && parsed_lgb.address) {
                if(try_mt_list(doc,url,resolve,reject,parsed_lgb)) {
                    return true;
                }
                resolve(parsed_lgb.address);
                return true;
            }
        }
        return false;
    }
    /* do the parsed context in query_response */
    function do_parsed_context(doc,url,resolve,reject,type,parsed_context) {
        var temp_add;
        if(parsed_context.url) parsed_context.url=MTP.fix_remote_url(parsed_context.url,url);
        console.log("parsed_context="+JSON.stringify(parsed_context));
        let curr_business={"url":parsed_context.url,"name":parsed_context.Title,"address":parsed_context.Address||"","phone":parsed_context.Phone||""};
        if(!/^More about/.test(curr_business.name)&&curr_business.name&&!parsed_context["Local time"]&&
           !(parsed_context.thing&&parsed_context.thing.type&&!parsed_context.thing.Address)
          ) {
            console.log("Business success with "+JSON.stringify(curr_business));
            if(parsed_context.thing.Address) {
                temp_add=new Address(parsed_context.thing.Address);
                console.log("temp_add="+JSON.stringify(temp_add)+", my_query.parsed_address="+JSON.stringify(my_query.parsed_address));
                my_query.business_list.push(curr_business);
                resolve("");
                return true;
            }
        }
        return false;
    }
    function do_parsed_lgb(doc,url,resolve,reject,type,parsed_lgb) {
        var b1_success=true;
        if(parsed_lgb.url) parsed_lgb.url=MTP.fix_remote_url(parsed_lgb.url,url);

        console.log("parsed_lgb="+JSON.stringify(parsed_lgb));
        let curr_business={"url":parsed_lgb.url,"name":parsed_lgb.name,"address":parsed_lgb.address||"","phone":parsed_lgb.phone||""};
        if(curr_business.name!==curr_business.address&&curr_business.phone) {
            my_query.business_list.push(curr_business);
            b1_success=true;

        }
        else if(/^query_address$/.test(type) && parsed_lgb) {
            //console.log("Found parsed_lgb");
            let mt_lst=doc.querySelectorAll(".mt_biz_link");
            var promise_list=[];
            let y;
            if(mt_lst.length>0) {
                for(y of mt_lst) {
                    promise_list.push(make_addressplus_query(y.innerText.trim(),parsed_lgb.address)); }
                Promise.all(promise_list).then(function() { resolve("");

                                                          });
                return {b1_success:true,resolved:true};
            }
        }
        return {b1_success:b1_success,resolved:false};
    }

    function parse_search_results(doc,url,resolve,reject,type,b_algo) {
        var b_name,b_url,b_caption,p_caption,parsed_factrow,b_factrow,b1_success;
        var i,name_match,phone_match;
        var add_begin=my_query.address.replace(/^([^\s]+\s[^\s]+)\s.*$/,"$1");
        var mapquest_name_re=new RegExp("(.{1,}?)\\s"+add_begin);
        var buzzfile_name_re=new RegExp("^(.*?)\\s+in\\s+"+(my_query.parsed_address.city||""));
        var yp_name_re=/and more for (.*?)(?:\.\sSearch|\sat\s)/;
        var curr_pars;
        var name_parsers={".mapquest.com/":mapquest_name_re,".buzzfile.com/":buzzfile_name_re,
                         ".superpages.com/":buzzfile_name_re};
        var caption_parsers={".yellowpages.com/":yp_name_re};

        console.log("mapquest_name_re="+mapquest_name_re);
        var map_quest_phone_re=/Reviews (\([\d]{3}\)\s*[\d]{3}\-[\d]{4})/;
        var promise_list=[];

        for(i=0; i < b_algo.length&i<6; i++) {
            b_name=b_algo[i].getElementsByTagName("a")[0].textContent;
            b_url=b_algo[i].getElementsByTagName("a")[0].href;
            b_caption=b_algo[i].getElementsByClassName("b_caption");
            p_caption=(b_caption.length>0 && b_caption[0].getElementsByTagName("p").length>0) ?
                p_caption=b_caption[0].getElementsByTagName("p")[0].innerText : '';
            b_factrow=b_algo[i].querySelector(".b_factrow");
            if(b_factrow) {
                parsed_factrow=parse_b_factrow(b_factrow); }
            else parsed_factrow={};
            console.log("("+i+"), b_name="+b_name+", b_url="+b_url+", p_caption="+p_caption);
            for(curr_pars in name_parsers) {
                if(b_url.indexOf(curr_pars)!==-1&&(name_match=b_name.match(name_parsers[curr_pars]))) {
                    b1_success=true;
                    promise_list.push(make_addressplus_query(name_match[1],my_query.address));

                }
            }
            for(curr_pars in caption_parsers) {
                if(b_url.indexOf(curr_pars)!==-1&&(name_match=p_caption.match(caption_parsers[curr_pars]))) {
                    b1_success=true;
                    promise_list.push(make_addressplus_query(name_match[1],my_query.address));

                }
            }

            if(/yellowpages\.com/.test(b_url)&&(name_match=p_caption.match(yp_name_re))) {
                let curr_business={url:"",name:name_match[1],phone:parsed_factrow.Phone||"",address:my_query.address};
                //promise_list.push(make_addressplus_query(name_match[1],my_query.address));
                my_query.business_list.push(curr_business);
                b1_success=true;
                //break;

            }
            if(/mapquest\.com/.test(b_url)&&(name_match=b_name.match(mapquest_name_re))) {
                phone_match=p_caption.match(map_quest_phone_re);
                let good_phone=parsed_factrow.Phone?parsed_factrow.Phone:(phone_match?phone_match[1]:"");
                let curr_business={url:"",name:name_match[1],phone:good_phone,address:my_query.address};
                if(good_phone) {
                    //promise_list.push(make_addressplus_query(name_match[1],my_query.address));
                    my_query.business_list.push(curr_business);
                    b1_success=true; }
            }

        }
        if(b1_success) {
            Promise.all(promise_list).then(function() {
                console.log("Done search promises");
                resolve(""); })
                .catch(function(response) {
                console.log("Failed search promise "+response);
                resolve(""); });
            return true;
        }
        return false;
    }


    function query_response(response,resolve,reject,type) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        console.log("in query_response\n"+response.finalUrl+",type="+type);
        var search, b_algo, i=0, inner_a,y;
        var b_url="crunchbase.com", b_name, b_factrow,lgb_info, b_caption,p_caption,loc_hy,parsed_loc_hy;
        var b1_success=false, b_header_search,b_context,parsed_context,parsed_lgb,bm_details_overlay;
        var search_res_ret=false;

        try {
             search=doc.getElementById("b_content");
            b_algo=search.getElementsByClassName("b_algo");
            lgb_info=doc.querySelector("#lgb_info,#mt_tleWrp");
            b_context=doc.getElementById("b_context");
            loc_hy=doc.querySelector("#loc_hy");
            console.log("b_algo.length="+b_algo.length);
            
            if(/^query$/.test(type) && is_good_initial_query(doc,response.finalUrl,resolve,reject)) return;
            if(/^query_address/.test(type) && b_context&&(parsed_context=MTP.parse_b_context(b_context))) {
                if(do_parsed_context(doc,response.finalUrl,resolve,reject,type,parsed_context)) return;
            }
            if(/^query_address/.test(type) && lgb_info&&(parsed_lgb=MTP.parse_lgb_info(lgb_info))) {
                let lgb_result=do_parsed_lgb(doc,response.finalUrl,resolve,reject,type,parsed_lgb);

                if(lgb_result.resolved) return;
                b1_success=lgb_result.b1_success;
            }
            if(/^query_address/.test(type) && loc_hy && (parsed_loc_hy=MTP.parse_loc_hy(loc_hy))) {
                console.log("FOUND parse_loc");
                for(y of parsed_loc_hy) {
                    if(y.url) y.url=MTP.fix_remote_url(y.url,url);
                    my_query.business_list.push(y);
                }
                resolve("");
                return;
            }
            if(/^query_address$/.test(type)) {
                search_res_ret=parse_search_results(doc,response.finalUrl,resolve,reject,type,b_algo);
                console.log("search_res_ret="+search_res_ret);
                if(search_res_ret) return;
            }
            console.log("Fluck");
        }
        catch(error) {
            reject(error);
            return;
        }
        if(/^query_address_plus$/.test(type)) {
            resolve("");
            return;
        }

        reject("Nothing found");
        return;
    }

    function parse_b_factrow(factrow) {
        var ret={},re=/^([^:]*):\s*(.*)$/,match;
        var lst=factrow.querySelectorAll("li"),x;
        for(x of lst) {
            if((match=x.innerText.trim().match(re))) {

                ret[match[1].trim()]=match[2].trim();
            }
        }
        console.log("parse_b_factrow,ret="+JSON.stringify(ret));
        return ret;
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
        console.log("FUCK");
        console.log("query_promise_then, result="+result);
        my_query.address=result.replace(/,?\s+US$/,"");
        my_query.parsed_address=new Address(my_query.address);
        if(!my_query.parsed_address) my_query.parsed_address={};
        console.log("Found address "+my_query.address);
        if(!my_query.done.address) {
            const queryAddressPromise = new Promise((resolve, reject) => {
                console.log("Beginning URL search");
                query_search(my_query.address, resolve, reject, query_response,"query_address");
            });
            queryAddressPromise.then(query_address_promise_then)
                .catch(function(val) {
                console.log("Failed at this queryAddressPromise " + val);
                document.querySelector("#business_exists-0").checked=true;
                my_query.done.address=true;
                submit_if_done();
            });
        }
        //my_query.done.address=true;
        my_query.overlay_url="https://www.bing.com/maps/overlaybfpr?q="+encodeURIComponent(my_query.address);
        if(!my_query.done.overlay) {
            var queryOverlayPromise=MTP.create_promise(my_query.overlay_url,parse_bing_overlay,parse_overlay_then,function() {
                my_query.done.overlay=true;
                submit_if_done();
            });
        }
        submit_if_done();
    }

    function query_address_promise_then(result) {
        my_query.done.address=true;
        submit_if_done();
    }
    /* parse queries to bing of the form https://www.bing.com/maps/overlaybfpr?q="+encodeURIComponent(my_query.address);
     * to grab business data location at an address,
     * TODO: Modify to make generic
     */
    function parse_bing_overlay(doc,url,resolve,reject) {
        console.log("In parse_bing_overlay, url="+url);
        var moduleContainer=doc.querySelector(".EntityCollectionModuleContainer");
        var promise_list=[];
        if(!moduleContainer) {
            console.log("module container failed");
            reject("");
            return;
        }
        var ent_list,y;
        try {
            ent_list=JSON.parse(moduleContainer.dataset.entitylist);
            for(y of ent_list) {
                console.log("beginning promise list query of "+y.title);
                promise_list.push(make_addressplus_query(y.title,my_query.address));
            }
            Promise.all(promise_list).then(function() { resolve(""); })
            .catch(function(response) {
                console.log("Failure in addressplus queries "+response);
                resolve(""); });


        }
        catch(error) {
            console.log("Error "+error+", parsing entitylist JSON");
            reject("");
            return;
        }
    }

    function parse_overlay_then(result) {
        my_query.done.overlay=true;
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
        var is_done=true,x;
        business_list_to_fields();
        add_to_sheet();
        console.log("submit_if_done, my_query.done="+JSON.stringify(my_query.done));
        for(x in my_query.done) if(!my_query.done[x]) is_done=false;
        if(is_done && !my_query.submitted && (my_query.submitted=true)) MTurk.check_and_submit();
    }
    function remove_dups(lst) {
        var x;
        for(x=lst.length-1;x>=1;x--) {
            if(MTP.matches_names(MTP.shorten_company_name(lst[x].name),MTP.shorten_company_name(lst[x-1].name))) {
                if((lst[x].url&&!lst[x-1].url)||(lst[x].phone&&!lst[x-1].phone)||(lst[x].address&&!lst[x-1].address)) {
                    lst.splice(x-1,1); }
                else {
                    lst.splice(x,1);
                }
            }
        }
    }
    function business_list_to_fields() {
        var x;
        var my_parsed=parseAddress.parseLocation(my_query.address);
        var curr_num=1;
        my_query.business_list.sort(function(b1,b2) {
            if(b1.name < b2.name) return -1;
            else if(b1.name > b2.name) return 1;
            else return 0;
        });
        console.log("business list="+JSON.stringify(my_query.business_list));
        remove_dups(my_query.business_list);
        if(my_query.business_list.length>0) {
            document.querySelector("#business_exists-0").checked=true; }
        else document.querySelector("#business_exists-1").checked=true;
        var x_parsed;
        console.log("my_query.business_list="+JSON.stringify(my_query.business_list));
        for(x of my_query.business_list) {
            x_parsed=parseAddress.parseLocation(x.address);
            console.log("my_parsed="+JSON.stringify(my_parsed)+", x_parsed="+JSON.stringify(x_parsed));
          //  if(!(my_parsed.street===x_parsed.street&&my_parsed.city===x_parsed.city&&my_parsed.zip===x_parsed.zip)) continue;
            my_query.fields["business_"+curr_num]=x.name;
            my_query.fields["address_"+curr_num]=x.address;
            my_query.fields["phone_number_"+curr_num]=x.phone;
            my_query.fields["url_"+curr_num]=!/bing\.com\//.test(x.url)?x.url:"";
            curr_num++;
            if(curr_num>8) break;
        }
    }

    function make_addressplus_query(name,address) {
        const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(name+" "+address, resolve, reject, query_response,"query_address_plus");
        });
        queryPromise.then(query_address_plus_promise_then)
            .catch(function(val) {
            console.log("Failed at this queryPromise " + val); GM_setValue("returnHit"+MTurk.assignment_id,true); });
        return queryPromise;
    }
    function query_address_plus_promise_then(result) {
        console.log("Done query_address_plus_promise,result="+result);

    }

    function add_business_paste() {
    }

    function init_Query() {
        console.log("in init_query");
        var i;
        var annoying_div=document.querySelector("crowd-form div div");
        annoying_div.parentNode.removeChild(annoying_div);
        var url=document.querySelector("form a");
        var re=/([^\/]+)$/,match;
        match=url.href.match(re);

        var good_add=decodeURIComponent(match[1]);
        console.log("good_add="+good_add);
        my_query={name,address:"",fields:{},found_nearby:false,done_yellowpages:false,
                  done:{address:false,overlay:false,nearby:false},
                  submitted:false,business_list:[]};
        add_business_paste();
	console.log("my_query="+JSON.stringify(my_query));
        var search_str=good_add;
        const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(search_str, resolve, reject, query_response,"query");
        });
        queryPromise.then(query_promise_then)
            .catch(function(val) {
            console.log("Failed at this queryPromises " + val);
            document.querySelector("#business_exists-0").checked=true;
            submit_if_done();


        });
    }

})();
