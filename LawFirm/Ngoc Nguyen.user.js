// ==UserScript==
// @name         Ngoc Nguyen
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Scrape Lawyers
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
    var bad_urls=["www.lawyer.com","uslawyersdb.com","ufind.name","spokeo.com","mylife.com","opendatany.com","www.avvo.com"];
    var MTurk=new MTurkScript(20000,750+(Math.random()*1000),[],begin_script,"A3KMDGF50SNLH",true);
    var MTP=MTurkScript.prototype;
    function is_bad_name(b_name,p_caption,i)
    {
        var reg=/[-\s\'\"’]+/g,b_replace_reg=/\s+[\-\|–]{1}.*$/g;
        var lower_b=b_name.toLowerCase().replace(reg,""),lower_my=my_query.name.replace(/\s(-|@|&|and)\s.*$/).toLowerCase().replace(reg,"");
        if(lower_b.indexOf(lower_my)!==-1 || lower_my.indexOf(lower_b)!==-1) return false;
        b_name=b_name.replace(b_replace_reg,"");
        my_query.name=my_query.name.replace("’","\'");
        console.log("b_name="+b_name+", my_query.name="+my_query.name);
        if(MTP.matches_names(b_name,my_query.name)) return false;
        if(i===0 && b_name.toLowerCase().indexOf(my_query.name.split(" ")[0].toLowerCase())!==-1) return false;
        return true;
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
	    if(b_context&&(parsed_context=MTP.parse_b_context(b_context))) {
            console.log("parsed_context="+JSON.stringify(parsed_context));
            if(parsed_context.url) my_query.fields.url=parsed_context.url;
            if(parsed_context.Address) {
                my_query.fields.address=parsed_context.Address;
                my_query.fields.zip=my_query.zip;
            }
            if(parsed_context.Phone) {
                my_query.fields.phone=parsed_context.Phone;
            }
            if(parsed_context.url && !MTP.is_bad_url(parsed_context.url,bad_urls,-1)) {
                my_query.fields.url=parsed_context.url;
                resolve(parsed_context.url);
                return;
            }
            add_to_sheet();


        }
            if(type==="zip") {
                let mt=doc.querySelector("#mt_tleWrp a"),split;
                if(mt&&(split=mt.innerText.trim().split(/,\s+/))) {
                    if(split.length>=3 && (resolve({city:split[1],state:split[2]})||true)) return;
                    else reject("");
                    return;
                }
            }
            if(lgb_info&&(parsed_lgb=MTP.parse_lgb_info(lgb_info))) {
                    console.log("parsed_lgb="+JSON.stringify(parsed_lgb)); }
            for(i=0; i < b_algo.length&&i<5; i++) {
                b_name=b_algo[i].getElementsByTagName("a")[0].textContent;
                b_url=b_algo[i].getElementsByTagName("a")[0].href;
                b_caption=b_algo[i].getElementsByClassName("b_caption");
                p_caption=(b_caption.length>0 && b_caption[0].getElementsByTagName("p").length>0) ?
                    p_caption=b_caption[0].getElementsByTagName("p")[0].innerText : '';
                console.log("("+i+"), b_name="+b_name+", b_url="+b_url+", p_caption="+p_caption);
                b_factrow=b_algo[i].querySelector(".b_factrow");
                if(b_factrow && /\.(avvo|lawyerscompass|lawyer)\.com/.test(b_url)) parse_b_factrow(b_name,b_url,b_factrow);
                if(type==="query" && /linkedin\.com/.test(b_url) && !is_bad_name(b_name)&&(b1_success=true)) break;
                if(type==="query" && !MTurkScript.prototype.is_bad_url(b_url, bad_urls,4,2) && (!is_bad_name(b_name)) && (b1_success=true)) break;
                if(type==="fb" && /facebook\.com/.test(b_url) && !MTP.is_bad_fb(b_url) && !is_bad_name(b_name) && !my_query.found_fb) {
                    my_query.found_fb=true;
                    my_query.fb_url=b_url;
                    my_query.done.fb=false;
                    b1_success=true;
                    break;
                }
            }
            if(b1_success && (resolve(b_url)||true)) return;
        }
        catch(error) {
            reject(error);
            return;
        }
        if(type==="query" && my_query.try_count[type]===0) {
            my_query.try_count[type]++;
             var search_str=my_query.name+" "+my_query.city+" "+my_query.state+" lawyer";
            query_search(search_str, resolve, reject, query_response,"query");
            return;
        }
        if(type==="query" && my_query.try_count[type]===1) {
            my_query.try_count[type]++;
             let search_str=my_query.name+" "+my_query.state+" lawyer";
            query_search(search_str, resolve, reject, query_response,"query");
            return;
        }
        reject("Nothing found");
        return;
    }

    function parse_b_factrow(b_name,b_url,b_factrow) {
        console.log("In parse_b_factrow,b_url="+b_url);
        var el=b_factrow.querySelectorAll("li");
        var x;
        var re=/Phone:\s*(.*)$/,loc_re=/Location:\s*(.*)$/,match;
        for(x of el) {
            console.log("x.innerText="+x.innerText.trim());
            if((match=x.innerText.trim().match(re)) && my_query.fields.phone.length===0) {
                console.log("Match "+x.innerText.trim());
                my_query.fields.phone=match[0].trim();//.replace(/[^\d]*/g,"").replace(/^1/,"").trim();
                //my_query.fields.url=b_url;
            }
            if((match=x.innerText.trim().match(loc_re)) && my_query.fields.address.length===0) {
                console.log("Match "+x.innerText.trim());
                match[1]=match[1].trim().replace(/([-\d]{5,}),\s*([A-Z]{2})$/,"$2 $1");
                my_query.fields.address=match[1];//.replace(/[^\d]*/g,"").replace(/^1/,"").trim();
                //my_query.fields.url=b_url;
            }
        }

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
        my_query.fields.url=result;
        add_to_sheet();
        my_query.done.address=false;
        if(/linkedin\.com/.test(result)) {

            my_query.done.address=true;
            my_query.done.url=true;
            my_query.done.fb=true;
             submit_if_done();
            return;
        }
        var promise=MTP.create_promise(result,Address.scrape_address,address_then,function(response) {
            console.log("Failed address "+response); my_query.done.address=true; submit_if_done(); },{type:"",depth:1});
        call_contact_page(result,submit_if_done);
    }
    function address_then(result)  {
        console.log("Address.addressList="+JSON.stringify(Address.addressList));
       // console.log("Address.phoneList="+JSON.stringify(Address.phoneList));
        Address.addressList.sort(Address.cmp);
        if(Address.addressList.length>0&&my_query.fields.address.length===0&&
          Address.addressList[0].priority<1000) {
            my_query.fields.address=Address.addressList[0].address1+(Address.addressList[0].address2?","+Address.addressList[0].address1:"")+","+
                Address.addressList[0].city+", "+Address.addressList[0].state+" "+Address.addressList[0].postcode;
        }
        Address.phoneList.sort(function(a1,a2) { return a1.priority-a2.priority; });
        if(Address.phoneList.length>0 && my_query.fields.phone.length===0) my_query.fields.phone=Address.phoneList[0].phone;

        my_query.done.address=true; submit_if_done(); }

    var call_contact_page=function(url,callback,extension) {
        console.log("in call_contact_page, url="+url+", extension="+extension);
        if(extension===undefined || extension==='') { extension='';
                                   MTurk.queryList.push(url); }
        GM_xmlhttpRequest({method: 'GET', url: url,onload: function(response) {
            var doc = new DOMParser().parseFromString(response.responseText, "text/html");
            contact_response(doc,response.finalUrl,{extension:extension,callback:callback}); },
                           onerror: function(response) {
                               console.log("Fail");

                               MTurk.doneQueries++;
                               callback();
                           },
                           ontimeout: function(response) {
                               console.log("Fail timeout");
                               MTurk.doneQueries++;
                               callback(); }
                          });
    };
    /**
 * contact_response Here it searches for an email TODO:FIX */
    var contact_response=function(doc,url,extra) {
        console.log("in contact_response,url="+url);

        var i,j, my_match,temp_email,encoded_match,match_split;
        var extension=extra.extension,callback=extra.callback,nlp_temp;
        var begin_email=my_query.fields.email,title_result;
        if(extension===undefined) extension='';

        if(/wix\.com/.test(url)) {
            callback();
            return; }
        var x,scripts=doc.scripts,style=doc.querySelectorAll("style");
        MTP.fix_emails(doc,url);

        for(x=0;x<style.length;x++) { style[x].innerHTML=""; }

        console.log("in contact_response "+url);
        var short_name=url.replace(my_query.url,""),links=doc.links,email_matches,phone_matches;
        var replacement=url.match(/^https?:\/\/[^\/]+/)[0];
        var contact_regex=new RegExp("(Contact|(^About)|Legal|Team|Staff|Faculty|Teacher|People|Attorneys|"+my_query.attorney+")","i");
        var bad_contact_regex=/^\s*(javascript|mailto|tel):/i;
        console.log("replacement="+replacement);
        var temp_url,curr_url;
        var new_query_list=[];
        doc.body.innerHTML=doc.body.innerHTML.replace(/\s*([\[\(]{1})\s*at\s*([\)\]]{1})\s*/,"@")
            .replace(/\s*([\[\(]{1})\s*dot\s*([\)\]]{1})\s*/,".");
        MTP.fix_emails(doc,url);
        var promise_list=[];
        if((email_matches=doc.body.innerHTML.match(email_re))) {
            let t;
            for(t of email_matches) {
                my_query.email_list.push(new EmailQual(t,1)); }
            console.log("Found email hop="+my_query.fields.email);
        }
        if(phone_matches=doc.body.innerText.match(phone_re)) my_query.fields.phoneNumber=phone_matches[0];

        for(i=0; i < links.length; i++)
        {
            if(/instagram\.com\/.+/.test(links[i].href) && !/instagram\.com\/[^\/]+\/.+/.test(links[i].href) && my_query.done["insta"]===undefined) {
                my_query.done["insta"]=false;
                console.log("***** FOUND INSTAGRAM "+links[i].href);
                var temp_promise=MTP.create_promise(links[i].href,MTP.parse_instagram,parse_insta_then); }
             if(/facebook\.com\/.+/.test(links[i].href) && (/\/pages\//.test(links[i].href) || !MTP.is_bad_fb(links[i].href)) &&
               my_query.fb_url.length===0 && !my_query.found_fb) {
                console.log("FOUND FB");
                my_query.found_fb=true;
                my_query.done.fb=false;
                my_query.fb_url=links[i].href.replace(/\?.*$/,"").replace(/\/pages\/([^\/]*)\/([^\/]*)/,"/$1-$2");
                fb_promise_then(my_query.fb_url);
            }
             //console.log("i="+i+", text="+links[i].innerText);
            if(extension==='' &&
               (contact_regex.test(links[i].innerText)||/\/(contact)/i.test(links[i].href))
               && !/\.(lawyers|avvo|martindale|google)\.com/.test(links[i].href)              && !bad_contact_regex.test(links[i].href) &&
               !MTurk.queryList.includes(links[i].href=MTurkScript.prototype.fix_remote_url(links[i].href,url)) &&
              MTP.get_domain_only(links[i].href,true)===MTP.get_domain_only(url,true)
  ) {
                MTurk.queryList.push(links[i].href);
                console.log("*** Following link labeled "+links[i].innerText+" to "+links[i].href);
                new_query_list.push(links[i].href);
                continue;
            }
            //if(my_query.fields.email.length>0) continue;

            if((temp_email=links[i].href.replace(/^mailto:\s*/,"").match(email_re)) &&
               !MTurkScript.prototype.is_bad_email(temp_email[0])) {
                my_query.email_list.push(new EmailQual(temp_email.toString(),1));
            }
            if(links[i].href.indexOf("javascript:DeCryptX(")!==-1 &&
               (encoded_match=links[i].href.match(/DeCryptX\(\'([^\)]+)\'\)/))) my_query.fields.email=MTurkScript.prototype.DecryptX(encoded_match[1]);
            if(/^tel:/.test(links[i].href)) my_query.fields.phoneNumber=links[i].href.replace(/^tel:/,"");
            //if(email_re.test(temp_email) && !my_query.email_list.includes(temp_email)) my_query.email_list.push(temp_email);

        }
        for(x of new_query_list) {

            call_contact_page(x,callback,"NOEXTENSION");
        }

        console.log("* doing doneQueries++ for "+url);
        MTurk.doneQueries++;
        if(begin_email.length===0 && my_query.fields.email.length>0) my_query.fields.url=url;
        console.log("Calling evaluate emails from contact_response");
        callback();
        return;
    };

       function fb_promise_then(result) {
        var url=result.replace(/m\./,"www.").
        replace(/facebook\.com\/([^\/]+).*$/,"facebook.com/pg/$1").replace(/\/$/,"")+"/about/?ref=page_internal";
        my_query.fb_url=url;
        console.log("FB promise_then, new url="+url);
        var promise=MTP.create_promise(url,MTP.parse_FB_about,parse_fb_about_then);

    }

    function parse_fb_about_then(result) {
        console.log("result="+JSON.stringify(result));
        my_query.done.fb=true;
        if(result.team.length>0) {
            var fullname=MTP.parse_name(result.team[0]);
            my_query.fields.first=fullname.fname;
        }
        if(result.address && my_query.fields.address.length===0) my_query.fields.address=result.address;
        if(result.phone && my_query.fields.phone.length===0) my_query.fields.phone=result.phone;
        if(result.email) {
            my_query.email_list.push(new EmailQual(result.email,1));
          //  evaluate_emails(submit_if_done);
           /* if(!(my_query.fields.email.length>0 && /info@/.test(result.email))) {
                my_query.fields.email=result.email; }*/
            submit_if_done();
        }

        else {

            console.log("Calling submit_if_done from parse_fb_about_then");
            submit_if_done();
        }
    }

    function remove_dups(lst) {
        console.log("in remove_dups,lst="+JSON.stringify(lst));
        for(var i=lst.length;i>0;i--) { if(typeof(lst[i])!=="string"||(typeof(lst[i-1]==="string") &&
            lst[i].toLowerCase()===lst[i-1].toLowerCase())) lst.splice(i,1);
                                      }
    }

    function parse_insta_then(result) {
        console.log("insta_result="+JSON.stringify(result));
        if(result.email) {
             my_query.email_list.push(new EmailQual(result.email,0));
            console.log("Calling evaluate emails, parse_insta_then");
            submit_if_done();
        }
       // if(result.email&&my_query.fields.email.length===0) { my_query.fields.email=result.email; }
        my_query.done["insta"]=true;
        console.log("Calling submit_if_done, parse_insta_then");

        submit_if_done();
    }

    function EmailQual(email,quality) {
            this.email=email.replace(/^20/,"");
            this.domain=email.replace(/^[^@]*@/,"");
            this.quality=0;
            if(quality) this.quality=quality;
        if(MTP.is_bad_email(email)) this.quality=-1;
    }
    function email_cmp(e1,e2) {
        if(e1.quality!==e2.quality) return e2.quality-e1.quality;
        else if(e1.email < e2.email) return -1;
        else return 1;
    }


    function begin_script(timeout,total_time,callback) {
        if(timeout===undefined) timeout=200;
        if(total_time===undefined) total_time=0; 
        if(callback===undefined) callback=init_Query;
        if(MTurk!==undefined&&Address!==undefined) { callback(); }
        else if(total_time<2000) {
            console.log("total_time="+total_time);
            total_time+=timeout;
            setTimeout(function() { begin_script(timeout,total_time,callback); },timeout);
            return;
        }
        else { console.log("Failed to begin script"); }
    }

    function add_to_sheet() {
        var x,field,match;
        //console.log("my_query.fields="+JSON.stringify(my_query.fields));
        var field_map={url:"website","website":"website",attorneyct:"attorneyct",address:"address",zip:"zip",phone:"phone","email":"email","Notes":"Notes",

                      "Active":"Active","Contact":"Contact"};
       /* var cinput=document.querySelectorAll("crowd-input"),y,found=false;
        for(y of cinput) {
            for(x in field_map) {
                found=false;

                if(y.name===field_map[x]) {
                    found=true;
                    break;
                }
            }
            if(!found) field_map[y.name]=y.name;
        }*/


        my_query.fields.address=my_query.fields.address.replace(/[,\s]*$/,"").replace(/,[\s,]*/g,", ");
        my_query.fields.phone=my_query.fields.phone.replace(/[^\d]*/g,"").replace(/^1/,"")
            .replace(/([\d]{3})([\d]{3})([\d]{4})/,function(match,p1,p2,p3) {
            return p1+"-"+p2+"-"+p3;
        });
        if((match=my_query.fields.address.match(/^(.*?),?\s+([\-\d]*)$/))) {
            my_query.fields.address=match[1];
            my_query.fields.zip=match[2].replace(/\-.*$/,"");
        }
        else if(my_query.fields.zip.length===0) my_query.fields.zip=my_query.zip;



        if(my_query.email_list.length>0) {
            my_query.email_list.sort(email_cmp);
         //  console.log("my_query.email_list="+JSON.stringify(my_query.email_list));
            if(my_query.email_list[0].quality>=0) {
                my_query.fields.email=my_query.email_list[0].email;
            }
        }

        check_fields();

        for(x in my_query.fields) {
            if((MTurk.is_crowd && (field=document.getElementsByName(field_map[x])[0])) ||
	       (!MTurk.is_crowd && (field=document.getElementById(field_map[x])))) field.value=my_query.fields[x];
        }
	
    }

    function check_fields() {

        if(my_query.fields.email.length===0) my_query.fields.email="NA";
        if(my_query.fields.url.length===0) my_query.fields.url="NA";
    }

    function submit_if_done() {
        var is_done=true,x;
        add_to_sheet();
        if(MTurk.queryList.length>0 && MTurk.doneQueries>=MTurk.queryList.length) {
            my_query.done.url=true; }
        console.log("my_query.done="+JSON.stringify(my_query.done)+"\ndoneQueries="+MTurk.doneQueries+", total="+MTurk.queryList.length);

        for(x in my_query.done) if(!my_query.done[x]) is_done=false;
        if(is_done && !my_query.submitted && (my_query.submitted=true)) MTurk.check_and_submit();
    }

    function parse_first_page(doc,url,resolve,reject) {
        console.log("first_page, url="+url);
    }

    function zip_promise_then(result) {
        console.log("zip_promise_then, result="+JSON.stringify(result));
        my_query.city=result.city;
        my_query.state=result.state;
        var search_str=my_query.name+" "+my_query.attorney+" lawyer "+my_query.city+" "+my_query.state;

        const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(search_str, resolve, reject, query_response,"query");
        });
        queryPromise.then(query_promise_then)
            .catch(function(val) {
            my_query.done.url=true;
            console.log("Failed at this queryPromise " + val); submit_if_done(); });

        const fbPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(search_str+" lawyer site:facebook.com", resolve, reject, query_response,"fb");
        });
        fbPromise.then(fb_promise_then)
            .catch(function(val) {
            my_query.done.fb=true;
            console.log("Failed at this fbPromise " + val); submit_if_done(); });
    }

    function init_Query()
    {
        console.log("in init_query");
        var i;
        bad_urls=bad_urls.concat(default_bad_urls);
        var crowd=document.querySelectorAll("crowd-input");
        var x;
        var phone=document.querySelector("crowd-input[name='phone']");

        crowd.forEach(function(elem) {
            elem.addEventListener("paste",function(e) {
                 e.preventDefault();
            var text = e.clipboardData.getData("text/plain").replace(/\n/g,", ").trim();
                console.log("e.target.name="+e.target.name);
                if(e.target.name==="email") my_query.email_list.push(new EmailQual(text,100));
                else my_query.fields[e.target.name]=text;
                add_to_sheet();
            });
            elem.addEventListener("change",function(e) {
                 e.preventDefault();
               // console.log("e.target.name="+e.target.name," e.target.value="+e.target.value);
                my_query.fields[e.target.name]=e.target.value;
                if(e.target.name==="email") my_query.email_list.push(new EmailQual(e.target.value,10000));
                add_to_sheet();
            });
        });
        for(x of crowd) {
            x.type="text";
            x.required=false;

        }
        var p=document.querySelector("p[style='color:red']");
        var zip=p.nextElementSibling.innerText.replace(/^[^:]*:\s*/,"");
        var attorney=p.parentNode.nextElementSibling?p.parentNode.nextElementSibling.innerText.replace(/^[^:]*:\s*/,""):"";
        //console.log("p.parentNode="+p.parentNode.nextElementSibling.innerText);
        my_query={name:p.innerText.trim(),zip:zip.replace(/Unknown/,"").replace(/\-.*$/,""),attorney:attorney.replace(/Unknown/,""),
                  fb_url:"",found_fb:false,email_list:[],
                  fields:{url:"",attorneyct:"1",address:"",zip:"",phone:"",email:"",Notes:"",Active:"Yes","Contact":""},
                  done:{url:false,address:false,fb:false},submitted:false,try_count:{"query":0}};

        console.log("my_query="+JSON.stringify(my_query));
        var name_match;
        if((name_match=my_query.name.match(/^([^,]*),? (Law Office|ATTORNEY)/i))) my_query.fields.Contact=name_match[1];
        else if((name_match=my_query.name.match(/^Law office(?:s)? of ([^,]*)$/i))) my_query.fields.Contact=name_match[1];

        if(my_query.zip.length>0) {
            const zipPromise = new Promise((resolve, reject) => {
                console.log("Beginning URL search");
                query_search(my_query.zip+" zip code", resolve, reject, query_response,"zip");
            });
            zipPromise.then(zip_promise_then)
                .catch(function(val) {
                my_query.done.zip=true;
                console.log("Failed at this zipPromise " + val); submit_if_done(); });
        }
        else {
            zip_promise_then({city:"",state:my_query.zip});
        }

         
    }

})();