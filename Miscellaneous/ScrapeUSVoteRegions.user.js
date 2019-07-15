// ==UserScript==
// @name         ScrapeUSVoteRegions
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  New script
// @author       You
// @include http://trystuff.com*
// @include *usvotefoundation.org*
// @grant  GM_getValue
// @grant GM_setValue
// @grant GM_deleteValue
// @grant GM_cookie
// @grant GM.cookie
// @grant GM_addValueChangeListener
// @grant GM_setClipboard
// @grant GM_xmlhttpRequest
// @grant GM_openInTab
// @grant GM_getResourceText
// @grant GM_cookie
// @grant GM_addStyle
// @connect google.com
// @connect bing.com
// @connect yellowpages.com
// @connect usvotefoundation.org
// @connect *
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/js/MTurkScript.js
// @require https://raw.githubusercontent.com/jacobmas/parse-address/0d1bcabec32de97df68f350be1084a0e695ddf23/parse-address.min.js

// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/bb627a536ea93d5e99a80e6a5750ed2388b00132/global/Address.js
// @resource GlobalCSS https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/globalcss.css
// ==/UserScript==

(function() {
    'use strict';
    var my_query = {};
    //var MTurk=new MTurkScript(20000,750+(Math.random()*1000),[],"","[TODO]",false);
    var MTP=MTurkScript.prototype;
    var state_data={};




    var state_fips={
        "Alabama":"1","Alaska":"2","American Samoa":"3", "Arizona":"4","Arkansas":"5","California":"6","Colorado":"7",
        "Connecticut":"8","Delaware":"9","District of Columbia": "10","Florida": "11","Georgia": "12","Guam":"13","Hawaii": "14",
        "Idaho":"15","Illinois":"16","Indiana":"17","Iowa":"18","Kansas": "19", "Kentucky": "20","Louisiana": "21", "Maine": "22",
        "Maryland": "23", "Massachusetts":"24", "Michigan": "25","Minnesota": "26", "Mississippi": "27", "Missouri": "28",
        "Montana": "29", "Nebraska": "30","Nevada": "31", "New Hampshire": "32", "New Jersey": "33", "New Mexico": "34",
        "New York": "35","North Carolina": "36", "North Dakota": "37", "Ohio": "39","Oklahoma": "40", "Oregon": "41", "Pennsylvania": "42",
        "Puerto Rico":"43","Rhode Island": "44", "South Carolina": "45", "South Dakota": "46","Tennessee": "47",
	       "Texas": "48", "Utah": "49","Virgin Islands":"52", "Vermont": "50", "Virginia": "51",
	       "Washington": "53", "West Virginia": "54","Wisconsin": "55", "Wyoming": "56",
	      };
    var fips_list=[];
    for(let x in state_fips) {
        fips_list.push({name:x,id:state_fips[x]}); }
    var bad_urls=[];
    if(/trystuff.com/.test(window.location.href)) init_Query();
    else if(/usvotefoundation.org/.test(window.location.href)) {
        init_cookiemonster();
    }

    function init_cookiemonster() {
        console.log("monstering up some cookies");
        var cookie_lst=["AWSALB","JSESSIONID","_ga","_gid"];
        var x;
        for(x of cookie_lst) {
             GM.cookie.delete({name:x},function(error) {
                    console.log(error||'success'); });
        }
        setTimeout(init_cookiemonster,300);
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
        add_to_sheet();
        for(x in my_query.done) if(!my_query.done[x]) is_done=false;
        if(is_done && !my_query.submitted && (my_query.submitted=true)) MTurk.check_and_submit();
    }
    function ElectionAddress(address_for,name,address,url,phone,email) {
        this.address_for=address_for;
        this.name=name;
        this.address=address;
        this.url=url;
        this.phone=phone;
        this.email=email;
    }

    function ElectionOfficial(name,title,phone,fax,email) {
        this.name=name;
        this.fullname=MTP.parse_name(this.name);
        this.title=title;
        this.phone=phone;
        this.fax=fax;
        this.email=email;
    }
    function my_address_cmp(add1,add2) {
        if(add1.address&&!add2.address) return -1;
        else if(add2.address&!add1.address) return 1;
        else if(!add2.address && !add1.address) return 0;
        if(add1.address.address1!==undefined && add2.address.address1===undefined) return -1;
        else if(add1.address.address1===undefined && add2.address.address1!==undefined) return 1;
        else if(add1.address.address1===undefined) return 0;
        else if(add1.address.address1.length>0 && add2.address.address1.length===0) return -1;
        else if(add1.address.address1.length===0 && add2.address.address1.length>0) return 1;
        else return 0;
    }

    function my_official_cmp(official1,official2) {
        var re=/New Voter Registrations|not on record/i;
        if(re.test(official1.name)&&!re.test(official2.name)) return 1;
        else if(!re.test(official1.name) && re.test(official2.name)) return -1;
        else return 0;
    }

    function VoteRegion(stateid,statename,regionid,regionname) {
        this.stateid=stateid;
        this.statename=statename;
        this.regionid=regionid;
        this.regionname=regionname;
        this.url="https://www.usvotefoundation.org/vote/eoddomestic.htm?submission=true&stateId="+this.stateid+"&regionId="+this.regionid;
        this.e_addresses=[];
        this.officials=[];
    }
    VoteRegion.prototype.update_address_for=function(x) {
        var short_region=this.regionname.replace(/^Town of /i,"").replace(/ City$/,"").replace(/ County$/,"");
        if(x.name.toLowerCase().indexOf(short_region.toLowerCase())===-1) x.name=x.name+", "+this.regionname;
    };
    VoteRegion.prototype.toString=function() {
        var ret=this.stateid+","+this.statename+","+this.regionid+","+this.regionname+","+this.url;
        return ret;
    }


    VoteRegion.prototype.toHTMLString=function() {
        var ret="\""+this.statename+"\",\""+this.regionname+"\"";
        var x,i;
        var ct=0;
        var max_add=5;
        this.e_addresses.sort(my_address_cmp);
        this.officials.sort(my_official_cmp);
        for(x of this.e_addresses) {
            console.log("x.address="+JSON.stringify(x.address));
            this.update_address_for(x);
            if(ct>=5) break;
            ct++;
            ret=ret+",\""+x.address_for+"\",\""+x.name+"\",\""+(x.address.address1?x.address.address1.trim():x.address.address1)
                +(x.address.address2?",":"")+x.address.address2+"\",\""+x.address.city+"\",\""
                +x.address.state+"\",\""+x.address.postcode+
                "\",\""+x.url+"\",\""+x.phone+"\",\""+x.email+"\"";
        }
        for(i=0;i<5-ct;i++) {
            ret=ret+",,,,,,,,,"; }
        ct=0;
        for(x of this.officials) {
            if(ct>=10) break;
            if(!/New Voter Registrations|not on record/i.test(x.name)) {
                ct++;
                ret=ret+",\""+x.title+"\",\""+x.fullname.fname+"\",\""+x.fullname.lname+"\",\""+x.phone+"\",\""+x.email+"\"";
            }
        }
        for(i=0;i<10-ct;i++) {
            ret=ret+",,,,,"; }
        return ret;
    }

    function replace_amp(str) {
        str=str.replace(/\&/g,"&amp;");
        return str;
    }
    /* init scraping places from usvote */
    function init_place_scrape(curr_state_pos,resolve,reject) {
        var curr_state=state_data[fips_list[curr_state_pos].id];
        var x;
        curr_state.place_list=[];
        for(x in curr_state) {
            if(x==='place_list') continue;
        //    console.log("curr_state["+x+"]="+curr_state[x]);
            curr_state.place_list.push(curr_state[x]);
        }

        begin_place_scrape(curr_state_pos,0,resolve,reject);

    }

    function begin_place_scrape(curr_state_pos,curr_place_pos,resolve,reject) {
        var curr_state=state_data[fips_list[curr_state_pos].id];
        var curr_place=curr_state.place_list[curr_place_pos];
        console.log("curr_place="+JSON.stringify(curr_place));
        if(curr_place_pos%100===(100-1)) print_state_data();
        var promise=new Promise((resolve,reject) => {

            call_page_place(curr_state,curr_place,resolve,reject);
        });
        promise.then(function(result) {
            console.log("Done place scraping");
           // init_place_scrape(curr_state_pos);

            curr_place_pos++;
            if(curr_place_pos<curr_state.place_list.length) {
                begin_place_scrape(curr_state_pos,curr_place_pos,resolve,reject);
                return;
            }
            else {
                resolve("");
                return;
            }
        });
        promise.catch(function(response) {
            console.log("Failed in begin_place_scrape_promise, response="+response);
        });
    }

    function delete_cookies() {
    }

    function call_page_place(curr_state,curr_place,resolve,reject) {
        GM.cookie.delete({name:'JSESSIONID'});
        GM.cookie.list({url: '*'}).then(function(cookies) {
            console.log("call_page_place, done GM.cookie.list");
            console.log(cookies);
            var x;
            for(x of cookies) {
                GM.cookie.delete({name:x.name},function(error) {
                    console.log(error||'success'); });
            }

            GM_xmlhttpRequest({method: 'GET', url: curr_place.url,
                               onload: function(response) {

                                   GM.cookie.list({url: 'https://www.usvotefoundation.org'}).then(function(cookies) {
                                       console.log("call_page_place, done GM.cookie.list");
                                       console.log(cookies);
                                   });
                                   //   console.log("response="+JSON.stringify(response));
                                   var doc = new DOMParser()
                                   .parseFromString(response.responseText, "text/html");
                                   parse_place_page(doc,response.finalUrl,resolve,reject,curr_place);
                               },
                               onerror: function(response) { console.log("Fail place_scrape"); },
                               ontimeout: function(response) { reject("Fail place_scrape timeout"); }
                              });
            });
    }

    function parse_place_page(doc,url,resolve,reject,curr_place) {
        console.log("parse_place_page, url="+url);
        parseLeoEodAddress(doc,url,curr_place);
        parseEodContact(doc,url,curr_place);
        resolve("");
    }


    function begin_state_scrape(curr_state_pos,max_state_pos) {
        var curr_state=fips_list[curr_state_pos].name;
        var curr_id=fips_list[curr_state_pos].id,curr_page=1;
        console.log("curr_state="+JSON.stringify(fips_list[curr_state_pos]));
        var promise=new Promise((resolve,reject) => {
            call_jsonregion(curr_state,curr_id,curr_page,resolve,reject); });
        promise.then(function(result) {
            console.log("Done state place scraping");
            var place_promise=new Promise((resolve,reject) => {
                init_place_scrape(curr_state_pos,resolve,reject); });
            place_promise.then(function() {
                curr_state_pos++;
                if(curr_state_pos<fips_list.length&&curr_state_pos<max_state_pos) {
                    begin_state_scrape(curr_state_pos,max_state_pos);
                }
                else {
                    print_state_data();
                }
            });
        });
        promise.catch(function(response) {
            console.log("Failed in begin_state_scrape_promise, response="+response);
        });
        /* Iterate through to call */
    }

    function call_jsonregion(curr_state,curr_id,curr_page,resolve,reject) {
        var url="https://www.usvotefoundation.org/vote/ajax/getJsonRegions2.htm?page="+curr_page+"&stateId="+curr_id;
        console.log("Calling json_region, page="+curr_page+", stateId="+curr_id+", url="+url);

        GM_xmlhttpRequest({method: 'GET', url: url,
                           onload: function(response) {

                              console.log("response="+JSON.stringify(response));

                               onloadjsonregion(curr_state,curr_id,curr_page,response,resolve,reject);
                           },
                           onerror: function(response) { reject("Fail"); },ontimeout: function(response) { reject("Fail"); }
                          });
    }

    function onloadjsonregion(curr_state,curr_id,curr_page,response,resolve,reject) {
        var result,x,curr_region;
        try {
         //   console.log("response.responseText="+response.responseText);
            console.log("curr_id="+curr_id+","+state_data[curr_id]);
            result=JSON.parse(response.responseText);
            // Add items
            for(x of result.items) {
                curr_region=new VoteRegion(curr_id,curr_state,x.id,x.text);
                state_data[curr_id][x.id]=curr_region;
            }

            if(50*curr_page<parseInt(result.total_count)) {
                call_jsonregion(curr_state,curr_id,curr_page+1,resolve,reject);
                return;
            }
            else resolve("");
        }
        catch(error) {
            console.log("Error parsing json in onloadjsonregion, error="+error);
        }
    }

    function print_state_data() {
        var text="";
        var x,y;
        for(x in state_data) {
            console.log("state_data["+x+"]="+state_data[x]);
            console.log(state_data[x].place_list);
            if(!state_data[x].place_list) continue;
            for(y of state_data[x].place_list) {
                console.log("y="+y);
                text=text+y.toHTMLString()+"<br>";
            }
        }
        document.body.innerHTML=text;
        GM.cookie.list({url: 'https://www.usvotefoundation.org'}).then(function(cookies) {
            console.log(cookies);
        });
    }

    function parseLeoEodAddress(doc,url,curr_region) {
       // var curr_region=state_data[state_id][region_id];
        var leo=doc.querySelector("#collapseLeoEodAddress");
        if(!leo) return;
        var dl=leo.querySelectorAll("dl");

        dl.forEach(function(elem) {
            var h4=elem.querySelectorAll("h4");
            var address_for="",name="",address="",phone="",email="";
            var dd=elem.querySelector("dd");
            var ret=parse_leo_dd(dd);
            ret.address=ret.address.trim().replace(/([\d]{5})([\s\n]+)(\-[\d]+)$/,"$1");
            if(ret.address.split(",").length>3 && /^[A-Z]/.test(ret.address)) ret.address=ret.address.replace(/^[^,]*,/,"").trim();
            console.log("ret.address="+ret.address);
            var temp_add=new Address(ret.address,0);
            console.log("temp_add="+JSON.stringify(temp_add));
            if(h4.length>=2) address_for=h4[0].innerText.replace(/:$/,"").trim()+" "+h4[1].innerText.trim();
            var e_add=new ElectionAddress(address_for,ret.name,temp_add,ret.url,ret.phone,ret.email);
            curr_region.e_addresses.push(e_add);
        });


    }
    function parse_leo_dd(dd) {
        var curr_state=0;
        var ret={name:"",address:"",url:"",phone:"",email:""},x;
        for(x of dd.childNodes) {
            if(curr_state===0 && x.nodeType===Node.TEXT_NODE) {
                ret.name=x.textContent.trim();
                curr_state++;
            }
            else if(curr_state===1 && x.nodeType===Node.TEXT_NODE) {
                ret.address=ret.address+(ret.address.length>0?",":"")+x.textContent.trim();
            }
            else if(curr_state===1 && x.nodeType===Node.ELEMENT_NODE && x.tagName==="BR" &&
               x.nextSibling && x.nextSibling.nodeType===Node.ELEMENT_NODE
               && x.nextSibling.tagName==="BR") curr_state++;
            else if(curr_state===2 && x.nodeType===Node.ELEMENT_NODE && x.tagName==="A") {
                ret.url=x.href;
                curr_state++;
            }
            else if(curr_state>=2 && curr_state<=3 && x.nodeType===Node.TEXT_NODE && /phone/.test(x.textContent)) {
                ret.phone=x.textContent.replace(/^[\s\n]*phone:\s*/,"").trim();
                curr_state=4;
            }
            else if(curr_state===4 && x.nodeType===Node.ELEMENT_NODE && x.tagName==="A") {
                ret.email=x.href.replace(/^\s*mailto:\s*/,"");
                curr_state++;
            }
        }
        return ret;
    }

    function parseEodContact(doc,url,curr_region) {
//        var curr_region=state_data[state_id][region_id];
        var eod=doc.querySelector("#collapseEodContact");
        var table=doc.querySelector("#collapseEodContact table.eod"),i;
        if(!table) return;
        var theads=table.querySelectorAll("thead"),tbodies=table.querySelectorAll("tbody");
        for(i=0;i<theads.length;i++) {
            if(i>=tbodies.length) break;
            parse_election_official(curr_region,theads[i],tbodies[i]);
        }
    }
    function parse_election_official(curr_region,thead,tbody) {
        var name="",title="",phone="",fax="",email="";
        var curr_row;
        if(thead.rows.length>0&&thead.rows[0].cells.length>=2) {
            name=thead.rows[0].cells[1].innerText.trim();
            title=thead.rows[0].cells[0].innerText.trim();
        }
        for(curr_row of tbody.rows) {
            if(curr_row.cells.length<2) continue;
            if(/Phone/.test(curr_row.cells[0].innerText)) phone=curr_row.cells[1].innerText.trim();
            if(/Fax/.test(curr_row.cells[0].innerText)) fax=curr_row.cells[1].innerText.trim();
            if(/Email/.test(curr_row.cells[0].innerText)) email=curr_row.cells[1].innerText.trim();
        }
        curr_region.officials.push(new ElectionOfficial(name,title,phone,fax,email));
    }

    function init_Query() {
        var x;
        console.log("in init_query");

     /*   GM.cookie.list({url: 'https://www.usvotefoundation.org'}).then(function(cookies,error) {
            console.log(cookies);
            var x;
            for(x of cookies) {
                GM.cookie.delete({name:x.name},function(error) {
                    console.log(error||'success'); });
            }
        });*/
        console.log("in init_query, typeof module="+(typeof module));
        for(x of fips_list) {
            state_data[x.id]={}; }
     
        begin_state_scrape(53,56);

    }

})();