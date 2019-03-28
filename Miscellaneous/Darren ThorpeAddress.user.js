// ==UserScript==
// @name         Darren ThorpeAddress
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Find website
// @author       You
// @include        http://*.mturkcontent.com/*
// @include        https://*.mturkcontent.com/*
// @include        http://*.amazonaws.com/*
// @include        https://*.amazonaws.com/*
// @include https://*cloudfront.net/*
// @include https://worker.mturk.com/*
// @include file://*
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
// @resource GlobalCSS https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/globalcss.css
// ==/UserScript==

(function() {
    'use strict';
    var my_query = {};
    var bad_urls=[];
    var MTurk=new MTurkScript(20000,200,[],begin_script,"A3J9DW4MDUAE7C",true);
    if(/cloudfront/.test(window.location.href)) {
        setTimeout(begin_script,1000);
    }
    var check_and_submit=function(check_function)	{
        console.log("in check");
        var submit_button=document.querySelector(".hm-button");
        if(check_function!==undefined && !check_function()) {
            GM_setValue("returnHit",true);
            console.log("bad");
            return;
        }
        console.log("Checking and submitting");
        if(GM_getValue("automate")) setTimeout(function() { submit_button.click(); }, 1000);
    };
    var MTP=MTurkScript.prototype;
    function is_bad_name(b_name,type,i)
    {
        var reg=/[-\s\'\"’]+/g,b_replace_reg=/\s+[\-\|–]{1}.*$/g;
        var lower_b=b_name.toLowerCase().replace(reg,""),lower_my=my_query.name.replace(/\s(-|@|&|and)\s.*$/).toLowerCase().replace(reg,"");
        if(lower_b.indexOf(lower_my)!==-1 || lower_my.indexOf(lower_b)!==-1) return false;
        let temp_b_name=b_name.replace(b_replace_reg,"");
        let temp_name=my_query.name.replace("’","\'");
        console.log("b_name="+temp_b_name+", my_query.name="+temp_name);

        if(MTP.matches_names(temp_b_name,temp_name)) return false;

        if(temp_b_name.toLowerCase().indexOf(temp_name.toLowerCase())!==-1) return false;
        return true;
    }
    /* Text can be an object or a string with address text */
    function Address(text,priority,location) {
        console.log("# In address for "+text);
        if(typeof(text)==='object' &&
          this.set_address(text.address1,text.address2,text.city,text.state,text.postcode,text.country)) this.priority=priority;
        else if(this.parse_address(text.trim())) this.priority=priority;
        else this.priority=(1 << 25);;
    }
    Address.prototype.parse_address=function(text) {
        if(this.parse_address_US(text)) return true;
        if(this.parse_address_Canada(text)) return true;
        if(/[^A-Za-z]Sweden$/.test(text) && this.parse_address_Sweden(text)) return true;
        if(/[^A-Za-z](UK|United Kingdom)$/.test(text) && this.parse_address_UK(text)) return true;
        if(/[^A-Za-z](Belgium)$/.test(text) && this.parse_address_Belgium(text)) return true;
        if(this.parse_address_Europe(text)) return true;
        return false;
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

    Address.prototype.parse_address_US=function(text) {
        var fl_regex=/(?:,\s*)?([\d]+(th|rd|nd) Fl(?:(?:oo)?r)?)\s*,/i,match;
        var floor=text.match(fl_regex);
        text=text.replace(fl_regex,",").trim().replace(/\n/g,",");
        text=text.replace(/,\s*(US|United States|United States of America|USA)$/i,"")
        var parsed=parseAddress.parseLocation(text);
        if(parsed&&parsed.city&&parsed.zip) {
            this.address1=(parsed.number?parsed.number+" ":"")+(parsed.prefix?parsed.prefix+" ":"")+
                (parsed.street?parsed.street+" ":"")+(parsed.type?parsed.type+" ":"")+(parsed.suffix?parsed.suffix+" ":"");
            this.address2="";
            this.address2=(parsed.sec_unit_type?parsed.sec_unit_type+" ":"")+
                (parsed.sec_unit_num?parsed.sec_unit_num+" ":"");
            if(!this.address2 || this.address2==="undefined") this.address2="";
            if(floor) this.address2=this.address2+(this.address2.length>0?",":"")+floor[1];
            if(!this.address2 || this.address2==="undefined") this.address2="";
            this.city=parsed.city?parsed.city:"";
            this.state=parsed.state?parsed.state:"";
            this.postcode=parsed.zip?parsed.zip:"";
            this.country="United States";
            return true;
        }
        return false;
    };
    Address.prototype.parse_address_Canada=function(text) {
        var match;
        if(match=text.match(/([A-Z]{1}\d{1}[A-Z]{1} \d{1}[A-Z]{1}\d{1})$/)) {
            this.postcode=match[0];
            text=text.replace(/,?\s*([A-Z]{1}\d{1}[A-Z]{1} \d{1}[A-Z]{1}\d{1})$/,"");
            if(match=text.match(/(?:,|\s)\s*([A-Z]+)\s*$/)) {

                this.state=match[1];
                text=text.replace(/(,|\s)\s*([A-Z]+)\s*$/,"");
            }
            if(match=text.match(/^(.*),\s*([^,]*)$/)) {
                this.address1=match[1];
                this.city=match[2];
            }
            this.country="Canada";
            return true;
        }
        return false;
    };
    Address.prototype.parse_address_Europe=function(text) {
        var split=text.split(/\s*,\s*/),postcode,match;
        var regex1=/^([^,]+),\s*((?:B-)?[\d]{4})\s+([^,]+),\s*([^,]+)$/;
        var regex2=/^([^,]+),\s*\s+([^,]+),\s*((?:[A-Z]+-)?[\d]+),\s*([^,]+)$/;
        var regex3=/^([^,]+),([^,]+),\s*((?:[A-Z]+-)?[\d]+)\s*,\s*([^,]+)$/;
        if((match=text.match(regex1)) && this.set_address(match[1],"",match[3],"",match[2],match[4])) return true;
        if((match=text.match(regex2)) && this.set_address(match[1],"",match[2],"",match[3],match[4])) return true;
        if((match=text.match(regex3)) && this.set_address(match[1],"",match[2],"",match[3],match[4])) return true;
        console.log("parse_address_Europe,"+text);
        return false;
    };
    Address.prototype.parse_address_Belgium=function(text) {
        var split=text.split(/\s*,\s*/),postcode,match;
        var regex1=/^([^,]+),\s*((?:B-)?[\d]{4})\s+([^,]+),\s*Belgium$/;
        var regex2=/^([^,]+),\s*\s+([^,]+),\s*((?:B-)?[\d]{4}),\s*Belgium$/;
        if((match=text.match(regex1)) && this.set_address(match[1],"",match[3],"",match[2],"Belgium")) return true;
        if((match=text.match(regex2)) && this.set_address(match[1],"",match[2],"",match[3],"Belgium")) return true;
        return false;
    };
    Address.prototype.parse_address_UK=function(text) {
        var split=text.split(/\s*,\s*/),postcode,match;
        console.log("UK: split="+JSON.stringify(split));
        if(split.length===3&&(match=split[1].match(/[A-Z0-9\s]{3,}/))) {
            this.address1=split[0].trim();
            this.address2="";
            this.postcode=match[0].trim();
            this.state="";
            this.city=split[1].replace(/[A-Z0-9\s]{3,}/,"").trim();
            this.country="United Kingdom";
            return true;
        }
        return false;
    };
    Address.prototype.parse_address_Sweden=function(text) {
        var split=text.split(/\s*,\s*/),postcode,match;
        console.log("Sweden: split="+JSON.stringify(split));
        if(split.length===3&&(match=split[1].match(/(?:SE-)?([\d\s]+)/))) {
            this.address1=split[0].trim();
            this.address2="";
            this.postcode=match[0].trim();
            this.state="";

            this.city=split[1].replace(/(?:SE-)?([\d\s]+)/,"").trim();
            this.country="Sweden";
            return true;
        }
        return false;
    };
    Address.cmp=function(add1,add2) {
        if(!(add1 instanceof Address && add2 instanceof Address)) return 0;
        if(add1.priority<add2.priority) return -1;
        else if(add1.priority>add2.priority) return 1;
        else return 0;
    };
    Address.queryList=[];
    Address.addressList=[];
    Address.addressStrList=[];
    Address.parse_postal_elem=function(elem,priority,site) {
        var ret={},text;
        var term_map={"streetaddress":"address1","addressLocality":"city","addressRegion":"state","postalCode":"zip","addressCountry":"country"};
        var curr_item,x;
        for(x in term_map) {
            console.log("term_map["+x+"]="+term_map[x]+"[itemprop='"+x+"'] i");
            if(curr_item=elem.querySelector("[itemprop='"+x+"' i]")) {
                console.log("curr_item.innerText.trim()="+curr_item.innerText.trim());
                ret[term_map[x]]=curr_item.innerText.trim().replace(/\n/g,",").trim(); }
        }
        if(/,/.test(ret.address1)) {
            ret.address2=ret.address1.replace(/^[^,]+,/,"");
            ret.address1=ret.address1.replace(/,.*$/,"");
        }
        if(ret.address1&&ret.city&&ret.state&&ret.zip) {
            //text=ret.address1+","+ret.city+", "+ret.state+" "+ret.zip;
            console.log("* Adding address in parse_postal_elem for "+site+", text");
            Address.address_list.push(new Address(ret,priority));
        }
    };
    /* Extra has some kinda of type field and a depth field indicating the depth */
    Address.scrape_address=function(doc,url,resolve,reject,extra) {
        var type=extra.type,depth=extra.depth,links=doc.links,i,promise_list=[];
        var contact_regex=/(Contact|Location|Privacy|Kontakt)/i,bad_contact_regex=/^\s*(javascript|mailto):/i,contact2_regex=/contact[^\/]*/i;
       // if(/^(404|403|503|\s*Error)/i.test(doc.title) || /\?reqp\=1&reqr\=/.test(url)) my_query.failed_urls+=2;
        console.log("In scrape_address for type="+type+", url="+url);
        if(depth===0) {
            for(i=0; i < links.length; i++) {
                links[i].href=MTP.fix_remote_url(links[i].href,url).replace(/\/$/,"");
                if((contact_regex.test(links[i].innerText) || contact2_regex.test(links[i].href))
                   && !bad_contact_regex.test(links[i].href) &&
                   !Address.queryList.includes(links[i].href) && Address.queryList.length<10) {
                    Address.queryList.push(links[i].href);
                    console.log("*** Following link labeled "+links[i].innerText+" to "+links[i].href);
                    promise_list.push(MTP.create_promise(links[i].href,Address.scrape_address_page,function(result) {
                        console.log("! Finished parsing ") },MTP.my_catch_func,type));
                    continue;
                }
            }
        }
        // scrape this page
        promise_list.push(new Promise((resolve1,reject1) => {
            Address.scrape_address_page(doc,url,resolve1,reject1,type);
        }).then(MTP.my_then_func).catch(MTP.my_catch_func));
        Promise.all(promise_list).then(function(result) {
           // console.log("Done all promises in scrape_address for "+type);
            console.log("&& my_query.address_str_list="+JSON.stringify(Address.addressStrList));
            resolve(""); })
        .catch(function(result) { console.log("Done all promises in scrape_address for "+type);
            console.log("&& my_query.address_str_list="+JSON.stringify(Address.addressStrList));
            resolve(""); });
    };

    Address.scrape_address_page=function(doc,url,resolve,reject,type) {
        console.log("scrape_address_page,url="+url);
        var posts=doc.querySelectorAll("[itemtype='https://schema.org/PostalAddress']");
        posts.forEach(function(elem) { Address.parse_postal_elem(elem,1,type); });
        var divs=doc.querySelectorAll("div,p,span,td"),i;
        for(i=0;i<divs.length;i++) if(!divs[i].querySelector("div")) Address.scrape_address_elem(doc,divs[i],type);
        resolve("");
    };
    Address.scrape_address_elem=function(doc,div,type) {
        var scripts=div.querySelectorAll("script,style"),i;
        var heads=doc.querySelectorAll("h1,h2,h3,h4,h5");
        for(i=0;i<heads.length;i++) heads[i].innerHTML="";
        var add_regex1=/Address: (.*)$/,match,add_elem=div.querySelector("address"),text,jsonstuff;
       // console.log("Begin scrape_address_elem on "+div.innerText);
        for(i=0;i<scripts.length;i++) scripts[i].innerHTML="";
       // console.log("Done removing scripts");
        if(div.innerText.length>500) return;
        try {
            if(div.tagName==="DIV" && /sqs-block-map/.test(div.className) && (jsonstuff=JSON.parse(div.dataset.blockJson))) {
                Address.addressList.push(new Address(jsonstuff.location.addressLine1+","+jsonstuff.location.addressLine2,0));
            }
        }
        catch(error) { console.log("Error parsing jsonstuff"); }
    //    console.log("Past block map");
        if(((match=div.innerText.match(add_regex1))&&(text=match[1])) || (add_elem && (text=Address.fix_address_text(add_elem.innerText))) ||
        (text=Address.fix_address_text_full(doc,div))
          )  {
           console.log("scrape_elem, text="+text);
            text=text.replace(/\n([\t\s\n])+/g,"\n").replace(/,\s*USA/,"").replace(/\n/g,",").replace(/,[\s,]*/g,",");
            //console.log("scrape_elem, text="+text);
            let parsed;
           // console.log("add_regex1, div="+div.innerText);
            if(!Address.addressStrList.includes(text)) {
                text=text.replace(/,[\s,]*/g,",");
                var address=new Address(text,1);
                if(address.city==="") {
                    console.log("temp_text="+temp_text);
                    let temp_text=text;
                    while(address.city==="" && temp_text.match(/^[^,]*,\s*/)) {
                        temp_text=temp_text.replace(/^[^,]*,\s*/,"");
                        address=new Address(temp_text,1);
                    }
                }
                if(address.city==="") {
                    var split=address.split(/\s*|\s*/);
                    for(i=0;i<split.length;i++) if((address=new Address(split[i])) && address.city.length>0) break;
                }
                Address.addressList.push(address);
                Address.addressStrList.push(text);
            }
        }
    }
    Address.fix_address_text_full=function(doc,div) {
        var text="";
        if(div.innerText.trim().length===0) return null;
        text=div.innerText.match(/(.{1,100}\n+)?(.*(Suite|Ste).*\n+)?.*,\s*[A-Za-z\s]+(,)?\s+[\d\-]+/i);
        if(text) text[0]=text[0].replace(/^.*Address:[\s,]*/i,"");
        if(text) return text[0].replace(/\n/g,",");
        return null; }
    Address.fix_address_text=function(text) {
        text=text.replace(/^\n/g,"").replace(/\n$/g,"");
        while(text.length>0 && !/^\s*(one|two|three|four|five|six|seven|eight|nine|[\d]+)([^a-zA-Z0-9]+)/.test(text)) {
            let old_text=text;
            text=text.replace(/^[^\n]+\n/,"");
            if(old_text===text) break;
        }
        text=text.replace(/^.*Address:[\s,]*/i,"");
        return text.trim();
    };
   function add_text(text) {
        var fl_regex=/(,\s*)?([\d]+(th|rd|nd) Fl(?:(?:oo)?r)?)\s*,/i,match;
        var floor=text.match(fl_regex);
        text=text.replace(fl_regex,",").replace(/,\s*USA$/,"").trim();
        var parsed=parseAddress.parseLocation(text),add1,add2,city,state,zip;
        if(parsed&&parsed.city&&parsed.state) {
            console.log("parsed="+JSON.stringify(parsed));
            add1=(parsed.number?parsed.number+" ":"")+(parsed.prefix?parsed.prefix+" ":"")+
                (parsed.street?parsed.street+" ":"")+(parsed.type?parsed.type+" ":"")+(parsed.suffix?parsed.suffix+" ":"");
            add2=(parsed.sec_unit_type?parsed.sec_unit_type+" ":"")+
                (parsed.sec_unit_num?parsed.sec_unit_num+" ":"");
            city=parsed.city?parsed.city:"";
            state=parsed.state?parsed.state:"";
            zip=parsed.zip?parsed.zip:"";
            document.getElementsByName("address1")[0].value=add1;
            document.getElementsByName("address2")[0].value=add2;
            document.getElementsByName("city")[0].value=city;
            document.getElementsByName("state")[0].value=state;
            document.getElementsByName("zip")[0].value=zip;
        }
        else if(match=text.match(/([A-Z]{1}\d{1}[A-Z]{1} \d{1}[A-Z]{1}\d{1})$/)) {
            document.getElementsByName("zip")[0].value=match[0];
            text=text.replace(/,?\s*([A-Z]{1}\d{1}[A-Z]{1} \d{1}[A-Z]{1}\d{1})$/,"");
            console.log("text="+text);
            if(match=text.match(/,\s*([A-Z]+)\s*$/)) {
                document.getElementsByName("state")[0].value=match[1];
            }
            text=text.replace(/,\s*([A-Z]+)\s*$/,"");
            console.log("text="+text);
            if(match=text.match(/^(.*),\s*([^,]*)$/)) {
                document.getElementsByName("address1")[0].value=match[1];
                document.getElementsByName("city")[0].value=match[2];
            }
        }
        else {
            document.getElementsByName("address1")[0].value=text;

        }
   }

    function urlcatch(val,type) {
        console.log("Failed at "+type+" promise " + val);
        my_query.done[type]=true;
        my_query.failed_urls++;


        submit_if_done();
    }

    function scrape_address(doc,url,resolve,reject,extra) {
        var type=extra.type,ext=extra.ext,links=doc.links,i,promise_list=[];
        var contact_regex=/(Contact|Location|Privacy|Kontakt)/i,bad_contact_regex=/^\s*(javascript|mailto):/i,contact2_regex=/contact[^\/]*/i;
        if(/^(404|403|503|\s*Error)/i.test(doc.title) || /\?reqp\=1&reqr\=/.test(url)) my_query.failed_urls+=2;
        console.log("In scrape_address for type="+type+", url="+url);
        if(ext==='') {
            for(i=0; i < links.length; i++) {
                // console.log("i="+i+", text="+links[i].innerText);
                links[i].href=MTP.fix_remote_url(links[i].href,url).replace(/\/$/,"");
                if((contact_regex.test(links[i].innerText) || contact2_regex.test(links[i].href))
                   && !bad_contact_regex.test(links[i].href) &&
                   !MTurk.queryList.includes(links[i].href) && MTurk.queryList.length<10) {
                    MTurk.queryList.push(links[i].href);
                    console.log("*** Following link labeled "+links[i].innerText+" to "+links[i].href);
                    promise_list.push(MTP.create_promise(links[i].href,scrape_address_page,function(result) {
                        console.log("! Finished parsing ") },MTP.my_catch_func,type));
                    continue;
                }
            }
        }
        promise_list.push(new Promise((resolve1,reject1) => {
            scrape_address_page(doc,url,resolve1,reject1,type);
        }).then(MTP.my_then_func).catch(MTP.my_catch_func));
        Promise.all(promise_list).then(function(result) {
           // console.log("Done all promises in scrape_address for "+type);
            my_query.done[type]=true;
            console.log("&& my_query.address_str_list="+JSON.stringify(my_query.address_str_list));
            resolve(""); })
        .catch(function(result) { console.log("Done all promises in scrape_address for "+type);
            my_query.done[type]=true;
            console.log("&& my_query.address_str_list="+JSON.stringify(my_query.address_str_list));
            resolve(""); });
    }
    function scrape_address_page(doc,url,resolve,reject,type) {
        console.log("scrape_address_page,url="+url);
        var posts=doc.querySelectorAll("[itemtype='https://schema.org/PostalAddress']");
        posts.forEach(function(elem) { Parser.parse_postal_elem(elem,1,type); });
        var divs=doc.querySelectorAll("div,p,span,td"),i;
        for(i=0;i<divs.length;i++) if(!divs[i].querySelector("div")) scrape_address_elem(doc,divs[i],type);
       // console.log("Done scraping page "+url);
        resolve("");
    }
    function scrape_address_elem(doc,div,type) {
        var scripts=div.querySelectorAll("script,style"),i;
        var heads=doc.querySelectorAll("h1,h2,h3,h4,h5");
        for(i=0;i<heads.length;i++) heads[i].innerHTML="";
        var add_regex1=/Address: (.*)$/,match,add_elem=div.querySelector("address"),text;
       // console.log("Begin scrape_address_elem on "+div.innerText);
        for(i=0;i<scripts.length;i++) scripts[i].innerHTML="";
       // console.log("Done removing scripts");
        if(div.innerText.length>500) return;
        try {
            if(div.tagName==="DIV" && /sqs-block-map/.test(div.className)) {
                var jsonstuff=JSON.parse(div.dataset.blockJson);
                console.log("#### FOUND blockjson="+JSON.stringify(jsonstuff));
                if(jsonstuff) {
                    my_query.address_list.push(new Address(jsonstuff.location.addressLine1+","+jsonstuff.location.addressLine2,0));
                }
                else {
                    console.log("div.innerHTML="+div.innerHTML); }
            }
        }
        catch(error) { console.log("Error parsing jsonstuff"); }
    //    console.log("Past block map");
        if(((match=div.innerText.match(add_regex1))&&(text=match[1])) || (add_elem && (text=fix_address_text(add_elem.innerText))) ||
        (text=fix_address_text_full(doc,div))
          )  {
           console.log("scrape_elem, text="+text);
            text=text.replace(/\n([\t\s\n])+/g,"\n").replace(/,\s*USA/,"").replace(/\n/g,",").replace(/,[\s,]*/g,",");
            //console.log("scrape_elem, text="+text);
            let parsed;


           // console.log("add_regex1, div="+div.innerText);
            if(!my_query.address_list.includes(text)) {
                text=text.replace(/,[\s,]*/g,",");
                var address=new Address(text,1);
                if(address.city==="") {
                               console.log("temp_text="+temp_text);

                    let temp_text=text;
                    while(address.city==="" && temp_text.match(/^[^,]*,\s*/)) {
                         temp_text=temp_text.replace(/^[^,]*,\s*/,"");
                        address=new Address(temp_text,1); }
                }
                if(address.city==="") {
                    var split=address.split(/\s*|\s*/);
                    for(i=0;i<split.length;i++) {
                        if((address=new Address(split[i])) && address.city.length>0) break;
                    }
                }
                my_query.address_list.push(address);
                my_query.address_str_list.push(text);
            }
        }
       // console.log("Done scrape_address_elem");

    }
    function fix_address_text_full(doc,div) {
        var text="";
        if(div.innerText.trim().length===0) return null;
    //    console.log("IN fix_address_text_full: "+div.innerText.trim());
        text=div.innerText.match(/(.{1,100}\n+)?(.*(Suite|Ste).*\n+)?.*,\s*[A-Za-z\s]+(,)?\s+[\d\-]+/i);
     //   console.log("Done match");
        if(text) text[0]=text[0].replace(/^.*Address:[\s,]*/i,"");

        if(text) return text[0].replace(/\n/g,",");
        return null; }
    function fix_address_text(text) {
        text=text.replace(/^\n/g,"").replace(/\n$/g,"");
        while(text.length>0 && !/^\s*(one|two|three|four|five|six|seven|eight|nine|[\d]+)([^a-zA-Z0-9]+)/.test(text)) {
        //    console.log("text="+text);
            let old_text=text;
            text=text.replace(/^[^\n]+\n/,"");
            if(old_text===text) break;
        }
        text=text.replace(/^.*Address:[\s,]*/i,"");
        //text=text.replace(/\n/g,",").replace(/,,+/g,",");
        return text.trim();
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
            b_algo=search.getElementsByClassName("b_algo");
            lgb_info=doc.getElementById("lgb_info");
            b_context=doc.getElementById("b_context");
            console.log("b_algo.length="+b_algo.length);
	    if(type==="address" && b_context&&(parsed_context=MTP.parse_b_context(b_context))) {
            if(parsed_context.Address) {
                my_query.address_list.push(new Address(parsed_context.Address,1));

            }
                console.log("parsed_context="+JSON.stringify(parsed_context));
            if(type==="query" && parsed_context.url && !MTP.is_bad_url(parsed_context.url,bad_urls,-1,3) && (resolve(parsed_context.url)||true)) return;
        }
            if(lgb_info&&(parsed_lgb=MTP.parse_lgb_info(lgb_info))) {
                if(parsed_lgb.address) {
                    my_query.address_list.push(new Address(parsed_context.Address,2));

                    console.log("parsed_lgb="+JSON.stringify(parsed_lgb)); }
            }
            for(i=0; i < b_algo.length&&i<5; i++) {
                b_name=b_algo[i].getElementsByTagName("a")[0].textContent;
                b_url=b_algo[i].getElementsByTagName("a")[0].href.replace(/\/en($|\/[^\/]*)/,"").replace(/\/$/,"");
                b_caption=b_algo[i].getElementsByClassName("b_caption");
                p_caption=(b_caption.length>0 && b_caption[0].getElementsByTagName("p").length>0) ?
                    p_caption=b_caption[0].getElementsByTagName("p")[0].innerText : '';
                console.log("("+i+"), b_name="+b_name+", b_url="+b_url+", p_caption="+p_caption);
                 b_factrow=b_algo[i].querySelector(".b_factrow");
                if(/query|address/.test(type) && !is_bad_name(b_name,type,i) && b_factrow) {
                    console.log("b_factrow="+b_factrow.innerHTML);
                    do_bfactrow(b_factrow,my_query.try_count[type]); }
              if(type==="query" && !MTurkScript.prototype.is_bad_url(b_url, bad_urls,4,2) && !/\.gov(\/|$)/.test(b_url) && !is_bad_name(b_name,type,i) && (b1_success=true)) break;
            }
            if(b1_success && (resolve(b_url)||true)) return;
        }
        catch(error) {
            reject(error);
            return;
        }
        if(my_query.try_count[type]===0) {
            my_query.try_count[type]++;
            if(type==="address") query_search(my_query.name+" address", resolve, reject, query_response,"address");
            if(type==="query") query_search(my_query.name, resolve, reject, query_response,"query");

            return;
        }
        reject("Nothing found");
        return;
    }
    function do_bfactrow(b_factrow,try_count) {
        var i;
        var inner_li=b_factrow.querySelectorAll("li");
        inner_li.forEach(function(inner_li) {
            var regex=/Location:\s*(.*)$/,match,text;
            if((match=inner_li.innerText.match(regex)) && !my_query.fields.city) {
                console.log("# Trying b_factrow with "+inner_li.innerText);

                text=match[1].trim().replace(/\s*([\d\-]{5,}),\s*([A-Za-z\s]+)\s*$/,"$2 $1");
                text=text.replace(/[,\s]*United States$/,"");
                console.log("* Adding address in b_factrow "+text);
                my_query.address_list.push(new Address(text,3+try_count));
                add_to_sheet();
                //add_text(text);
            }

        });
    }
    /* Search on bing for search_str, parse bing response with callback */
    function query_search(search_str, resolve,reject, callback,type) {
        console.log("Searching with bing for "+search_str);
        var search_URIBing='https://www.bing.com/search?q='+
            encodeURIComponent(search_str)+"&first=1&rdr=1";
        GM_xmlhttpRequest({method: 'GET', url: search_URIBing,
                           onload: function(response) { callback(response, resolve, reject,type); },
                           onerror: function(response) { reject("Fail"); },ontimeout: function(response) { reject("Fail"); }
                          });
    }

    /* Following the finding the district stuff */
    function query_promise_then(result) {

        add_to_sheet();
        var subButton=document.querySelector(".hm-button");
        subButton.disabled=false;
        my_query.done.query=true;
        my_query.url=result;
        console.log("FOUND URL="+my_query.url);
        var url=MTP.create_promise(my_query.url,scrape_address,parse_site_then,function(val) { urlcatch(val,"url") },
                                           {type:"url",ext:""});
        submit_if_done();

    }
    function add_promise_then(result) {

        add_to_sheet();
        var subButton=document.querySelector(".hm-button");
        subButton.disabled=false;
        my_query.done.address=true;

        submit_if_done();

    }
    function parse_site_then(result) {
        console.log("in parse_site_then, result="+JSON.stringify(result));
        my_query.done[result.site]=true;

        submit_if_done();

    }

    function begin_script(timeout,total_time,callback) {
        if(timeout===undefined) timeout=200;
        if(total_time===undefined) total_time=0;
        if(callback===undefined) callback=init_Query;
        if(MTurk!==undefined && document.querySelector("#root_address_found")) { callback(); }
        else if(total_time<2000) {
            console.log("total_time="+total_time);
            total_time+=timeout;
            setTimeout(function() { begin_script(timeout,total_time,callback); },timeout);
            return;
        }
        else { console.log("Failed to begin script"); }
    }
    function update_address() {
        var top,x;
        console.log("my_query.address_list="+JSON.stringify(my_query.address_list));
        my_query.address_list=my_query.address_list.filter(x => x.priority < (1 << 25));
        console.log("my_query.address_list="+JSON.stringify(my_query.address_list));

        my_query.address_list.sort(addr_cmp);
        if(my_query.address_list.length===0) return;
        top=my_query.address_list[0];
        for(x in top) {
            if(typeof(top[x])!=="function") console.log("x="+x+",top[x]="+top[x]);
            if(x in my_query.response.address) my_query.response.address[x]=top[x]; }

    }
    function add_to_sheet() {
        var x,field;
        update_address();
        var response=document.getElementsByName("response")[0];
        response.value=JSON.stringify(my_query.response);
        console.log("response="+response.value);
        console.log("response="+JSON.stringify(my_query.response));

        for(x in my_query.response.address) {
            if(x==='country' && (field=document.querySelector("#root_address_"+x+" div div"))) field.innerHTML=my_query.response.address[x];
            else if(field=document.getElementById("root_address_"+x)) field.value=my_query.response.address[x];
        }
    }

    function submit_if_done() {
        var is_done=true,x;
        add_to_sheet();
        for(x in my_query.done) if(!my_query.done[x]) is_done=false;
        if(is_done && !my_query.submitted && (my_query.submitted=true)) check_and_submit();
    }
    function do_address_paste(e) {
        e.preventDefault();
        var text = e.clipboardData.getData("text/plain").replace(/\s*\n\s*/g,",").replace(/,,/g,",").replace(/,\s*$/g,"").trim();
        console.log("text="+text);
        my_query.address_list.push(new Address(text,-50));
        add_to_sheet();
      // add_text(text);
    }

    function init_Query()
    {
        console.log("in init_query");
        var i;
        var inp=document.querySelectorAll("input");
        var x;


        bad_urls=default_bad_urls;

        var rootwebsite=document.querySelectorAll("#root_address_found div div");
        rootwebsite[1].innerHTML="Yes";
       var wT=document.querySelector(".hm-markdown table");
        var response=document.getElementsByName("response");
                console.log("response.length="+response.length);
        response[0].value="{\"website_found\":\"Yes\"}";
     /*    inp.forEach(function(elem) {

             elem.addEventListener("change",function(e) {
                 console.log("e.target.value="+e.target.value); });
             console.log("elem="+elem.outerHTML); });*/
        //var dont=document.getElementsByClassName("dont-break-out");
        my_query={name:wT.rows[1].cells[0].innerText,url:wT.rows[1].cells[1].innerText,fields:{},
                  done:{address:false,query:false,url:false},submitted:false,try_count:{"address":0,"query":0},
                  response:{address_found:"Yes",address:{address1:"",address2:"",city:"",state:"",postcode:"",country:""}},
                  address_list:[],
                  address_str_list:[]



                 };
        document.querySelector("#root_address_address1").addEventListener("paste",do_address_paste);
        document.querySelector(".hm-button").disabled=false;
        console.log("my_query="+JSON.stringify(my_query));
        var search_str="+\""+my_query.name+"\"";
        const addPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(search_str, resolve, reject, query_response,"address");
        });
        addPromise.then(add_promise_then)
            .catch(function(val) {
            console.log("Failed at this queryPromise " + val);
            my_query.done.address=true;
            submit_if_done();
        });
        const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(search_str, resolve, reject, query_response,"query");
        });
        queryPromise.then(query_promise_then)
            .catch(function(val) {
            console.log("Failed at this queryPromise " + val);
            my_query.done.query=true;
            submit_if_done();
        });
         /*var url=MTP.create_promise(my_query.url,scrape_address,parse_site_then,function(val) { urlcatch(val,"url") },
                                           {type:"url",ext:""});*/
    }

})();