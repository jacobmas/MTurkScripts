// ==UserScript==
// @name        Christina_PartnersGoogle
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Collect Company Info
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
    var MTurk=new MTurkScript(20000,750+(Math.random()*1000),[],begin_script,"A2QPUL838V9KR8",true);
    var MTP=MTurkScript.prototype;
    function is_bad_name(b_name)
    {
        return false;
    }

    function assign_address(add) {
        my_query.fields.address1=add.address1;
        my_query.fields.address2=add.address2;
        my_query.fields.city=add.city;
        my_query.fields.state=add.state;
        my_query.fields.zip=add.postcode;
        add_to_sheet();
    }
Address.prototype.parse_address=function(text) {
    this.text=this.text.replace(/\|/g,",");
    this.fix_nonewlinestreets();
    if(this.parse_address_US(text)) return 1;
    if(this.parse_address_Canada(text)) return 1;
    if(/[^A-Za-z]Sweden$/.test(text) && this.parse_address_Sweden(text)) return 1;
    if(/[^A-Za-z](UK|United Kingdom)$/.test(text) && this.parse_address_UK(text)) return 1;
    if(/[^A-Za-z](Belgium)$/.test(text) && this.parse_address_Belgium(text)) return 1;
    if(this.parse_address_Europe(text)) {
    return 2; }
    return 1<<25;
};

Address.prototype.fix_nonewlinestreets=function() {
    var x,temp_re;
    for(x in Address.street_type_map) {
        x=x[0].toUpperCase()+x.slice(1);
        temp_re=new RegExp('('+x+')([A-Z])');
        this.text=this.text.replace(temp_re,"$1,$2");
    }
};


// Set the address of something directly */
Address.prototype.set_address=function(address1,address2,city,state,postcode,country) {
    if(address1) this.address1=address1.trim();
    if(address2) this.address2=address2.trim();
    if(city) this.city=city.trim();
    if(state) this.state=state.trim();
    if(postcode) this.postcode=postcode.trim();
    if(country) this.country=country.trim();
    return true;
};

Address.sanitize_text_US=function(text) {
    text=text.replace(/\n/g,",");
    var fl_regex=/(?:,\s*)?([\d]+(th|rd|nd|st) Fl(?:(?:oo)?r)?)\s*([,\s])/i,match;
    var ann_regex=/(?:,\s*)(Annex [^,]*),/i;
    var floor=text.match(fl_regex),annex=text.match(ann_regex);
    var after_dash_regex=/^([^,]*?)\s+-\s+([^,]*)/;
    var after_dash=text.match(after_dash_regex),second_part;
    text=text.replace(after_dash_regex,"$1").trim();
    text=text.replace(fl_regex,"$3").trim();
    text=text.replace(/,\s*(US|United States|United States of America|USA)$/i,"");
    // replace PO DRAWER //
    text=text.replace(/(^|,)(\s*)(?:P\.?O\.?\s*)?(DRAWER|BOX)(\s)/i,"$1$2PO Box$4");
    text=text.replace(ann_regex,",").trim();
    text=text.replace(/([a-bd-z0-9])([A-Z][a-z]+)/,"$1,$2");
    //console.log("Before fix, text="+text);
    var parsed=parseAddress.parseLocation(text);
    var add2_extra=(floor?floor[1]:"");
    if(!(parsed&&parsed.city&&parsed.zip) && /^[A-Za-z]/.test(text)) {
    //console.log("Replacing A-Z beginning");
    text=text.replace(/^[^,]*,/,"").trim();
    }
    if(!((parsed=parseAddress.parseLocation(text))&&parsed.city&&parsed.zip)
       && /^[0-9]/.test(text)) {
        second_part=text.match(/^([^,]*),([^,]*),/);
        text=text.replace(/^([^,]*),([^,]*),/,"$1,");
    }
    add2_extra=add2_extra+(add2_extra.length>0&&second_part?",":"")+(second_part?second_part[2]:"");
    add2_extra=add2_extra+(add2_extra.length>0&&annex?",":"")+(annex?annex[1]:"");
    add2_extra=add2_extra+(add2_extra.length>0&&after_dash?",":"")+(after_dash?after_dash[2]:"");
    return {text:text,add2_extra:add2_extra};
};





      Address.scrape_address=function(doc,url,resolve,reject,extra) {

        let names=MTurkScript.prototype.find_company_name_on_website(doc,url);
        console.log("*** names=",names);
        var type=extra.type,depth=extra.depth,links=doc.links,i,promise_list=[];

          if(!depth) depth=0;
        Address.debug=extra.debug;
        var contact_regex=/(Contact|Location|Privacy|Kontakt|About)/i,bad_contact_regex=/^\s*(javascript|mailto):/i,contact2_regex=/contact[^\/]*/i;
        // if(/^(404|403|503|\s*Error)/i.test(doc.title) || /\?reqp\=1&reqr\=/.test(url)) my_query.failed_urls+=2;
        //console.log("In scrape_address for type="+type+", url="+url);
        if(depth===0) {
            for(i=0; i < links.length; i++) {
                links[i].href=MTP.fix_remote_url(links[i].href,url).replace(/\/$/,"");
                if((contact_regex.test(links[i].innerText) || contact2_regex.test(links[i].href))
                   && !bad_contact_regex.test(links[i].href) &&
                   !Address.queryList.includes(links[i].href) && Address.queryList.length<10) {
                    Address.queryList.push(links[i].href);
                    if(Address.debug) console.log("*** Following link labeled "+links[i].innerText+" to "+links[i].href);
                    promise_list.push(MTP.create_promise(links[i].href,Address.scrape_address_page,function(result) {
                         },MTP.my_catch_func,type));
                    continue;
                }
            }
        }
        // scrape this page
        promise_list.push(new Promise((resolve1,reject1) => {
            Address.scrape_address_page(doc,url,resolve1,reject1,type);
        }).then(MTP.my_then_func).catch(MTP.my_catch_func));
        Promise.all(promise_list).then(function(result) {
            resolve(names); })
            .catch(function(result) { if(Address.debug) console.log("Done all promises in scrape_address for "+type);
                                     if(Address.debug) console.log("&& my_query.address_str_list="+JSON.stringify(Address.addressStrList));
                                     resolve(""); });
    };


    function query_response(response,resolve,reject,type) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        console.log("in query_response\n"+response.finalUrl+", type="+type);
        var search, b_algo, i=0, inner_a;
        var b_url="crunchbase.com", b_name, b_factrow,lgb_info, b_caption,p_caption;
        var b1_success=false, b_header_search,b_context,parsed_context,parsed_lgb;
        var biz_re=/and is located at (.*? \d{5})\./,biz_match;
        try
        {
            search=doc.getElementById("b_content");
			b_algo=doc.querySelectorAll("#b_results > .b_algo");
            lgb_info=doc.getElementById("lgb_info");
            b_context=doc.getElementById("b_context");
            console.log("b_algo.length="+b_algo.length);
	    if(b_context&&(parsed_context=MTP.parse_b_context(b_context))) {
                console.log("parsed_context="+JSON.stringify(parsed_context)); 
				if(parsed_context.Address) {
                    let tempAdd=new Address(parsed_context.Address);
                    assign_address(tempAdd);
                }
				if(type==="query" && parsed_context.url&&!MTP.is_bad_url(parsed_context.url,bad_urls,-1)) {
                resolve(parsed_context.url);
                return;
            }
				} 
            if(lgb_info&&(parsed_lgb=MTP.parse_lgb_info(lgb_info))) {
                    console.log("parsed_lgb="+JSON.stringify(parsed_lgb));
                if(parsed_lgb.address) {
                    let tempAdd=new Address(parsed_lgb.address);
                    assign_address(tempAdd);
                }
					if(parsed_lgb.url&&!MTP.is_bad_url(parsed_lgb.url,bad_urls,-1)) {
                resolve(parsed_lgb.url);
                return;
            }
					
					}
            for(i=0; i < b_algo.length&&i<1; i++) {
                b_name=b_algo[i].querySelector("h2 a").textContent;
                b_url=b_algo[i].getElementsByTagName("a")[0].href;
                b_caption=b_algo[i].getElementsByClassName("b_caption");
                p_caption=(b_caption.length>0 && b_caption[0].getElementsByTagName("p").length>0) ?
                    p_caption=b_caption[0].getElementsByTagName("p")[0].innerText : (b_algo[i].querySelector("p")? b_algo[i].querySelector("p").innerText.trim():"");
                if(!p_caption && b_algo[i].querySelector(".b_snippetBigText")) {
                    p_caption=b_algo[i].querySelector(".b_snippetBigText").innerText.trim();
                }
                console.log("("+i+"), b_name="+b_name+", b_url="+b_url+", p_caption="+p_caption);
                if(type==="bizapedia" && (biz_match=p_caption.match(biz_re))) {
                    var add=new Address(biz_match[1]);
                    console.log("add=",add);
                    assign_address(add);
                }

                if(type==="query" && !MTurkScript.prototype.is_bad_url(b_url, bad_urls,4,2) && !MTurkScript.prototype.is_bad_name(b_name,my_query.name,p_caption,i)
		   && (b1_success=true)) break;
                                if(type==="bizapedia" && !MTurkScript.prototype.is_bad_name(b_name,my_query.name,p_caption,i)
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
        if(type==="query" && my_query.try_count[type]===0) {
            my_query.try_count[type]++;
                        query_search(my_query.name+" company", resolve, reject, query_response,"query");
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
        my_query.fields.CompanyURL=result;
        add_to_sheet();
        if(!my_query.fields.city) {
            var promise=MTP.create_promise(result,Address.scrape_address,parse_website_then,function() { GM_setValue("returnHit",true); });
        }
        else {
                    my_query.done.query=true;

            submit_if_done();
        }
    }

     function add_promise_then(result) {

                    my_query.done.address=true;

            submit_if_done();

    }

    AggParser.parse_bizapedia=function(doc,url,resolve,reject) {
        console.log("in parse_bizapedia, url="+url);
        var biz=doc.querySelector("[itemtype='https://schema.org/LocalBusiness']");
        var result={success:true,site:"bizapedia",fields:{}};
        var add=doc.querySelector("[itemprop='address']");
        if(add) {
            let streetAdd=add.querySelector("[itemprop='streetaddress']")?add.querySelector("[itemprop='streetaddress']").innerText:"";
            let city=add.querySelector("[itemprop='addresslocality']")?add.querySelector("[itemprop='addresslocality']").innerText:"";
            let state=add.querySelector("[itemprop='addressregion']")?add.querySelector("[itemprop='addressregion']").innerText:"";
            let zip=add.querySelector("[itemprop='postalcode']")?add.querySelector("[itemprop='postalcode']").innerText:"";
            if(streetAdd&&city&&state&&zip) {
                            result.address=new Address(streetAdd+","+city+", "+state+" "+zip);

                console.log("result.address=",result.address);
            }
        }
    resolve(result);

};

    function biz_promise_then(result) {
        my_query.bizapedia=result;
       // var promise=MTP.create_promise(result,AggParser.parse_bizapedia,parse_biz_then,function() { my_query.done.bizapedia=true; submit_if_done(); });
        my_query.done.bizapedia=true;
        submit_if_done();
    }

    function parse_biz_then(result) {
        console.log("parse_biz_then,result=",result);
        if(result&&result.address&&!my_query.fields.city) {
            assign_address(result.address);
        }
        my_query.done.bizapedia=true;
        submit_if_done();
    }

    function parse_website(doc,url,resolve,reject) {
        console.log("url=",url);
    }

    function parse_website_then() {
        my_query.done.query=true;
        console.log("Address.addressStrList=",Address.addressStrList);
        console.log("Address.addressList=",Address.addressList);
        Address.addressList=Address.addressList.sort(Address.cmp);
        if(Address.addressList.length>0&&Address.addressList[0].priority<1000&&!my_query.fields.city) {
            assign_address(Address.addressList[0]);


        }
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
        for(x in my_query.fields) if(!my_query.fields[x] && x!=="address2") is_done=false;
        if(is_done && !my_query.submitted && (my_query.submitted=true)) MTurk.check_and_submit();
        else if(is_done_dones && !my_query.submitted) {
            console.log("Failed to find all fields");
            GM_setValue("returnHit",true);
        }
    }

    function parse_partners(doc,url,resolve,reject) {
        console.log("doc=",doc);

        var links=doc.links;
        let x;
        for(x of links) {
            console.log("x.href=",x.href,"x.innerText=",x.innerText);
        }
        var a =doc.querySelector(".hero__website-btn");
        var name=doc.querySelector("meta[property='og:description']");
        console.log("name=",name);
        var cont=name.content.replace(/See how /,"").replace(/ can use .*$/,"");
        console.log("cont=",cont);
        my_query.name=cont;
        resolve(cont);
    }



    function parse_partners_then() {
        var search_str="\""+my_query.name+"\"";
        const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(search_str, resolve, reject, query_response,"query");
        });
        queryPromise.then(query_promise_then)
            .catch(function(val) {
            console.log("Failed at this queryPromise " + val); my_query.done.query=true; submit_if_done(); });

        const addPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(search_str+" headquarters", resolve, reject, query_response,"address");
        });
       addPromise.then(add_promise_then)
            .catch(function(val) {
            console.log("Failed at this queryPromise " + val); my_query.done.address=true; submit_if_done(); });
        const bizPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(search_str+" site:bizapedia.com", resolve, reject, query_response,"bizapedia");
        });
        bizPromise.then(biz_promise_then)
            .catch(function(val) {
            console.log("Failed at this bizPromise " + val); my_query.done.bizapedia=true; submit_if_done(); });

    }

    function init_Query()
    {
		bad_urls=bad_urls.concat(default_bad_urls);
        console.log("in init_query");
       
        my_query={url:document.querySelector("crowd-form a").href,fields:{CompanyURL:"",address1:"",city:""},done:{query:false,bizapedia:false,address:false},
		  try_count:{"query":0,address:0},
		  submitted:false};
	console.log("my_query="+JSON.stringify(my_query));
        var search_str;
       var promise=MTP.create_promise(my_query.url,parse_partners,parse_partners_then,function() { GM_setValue("returnHit",true); });
    }

})();