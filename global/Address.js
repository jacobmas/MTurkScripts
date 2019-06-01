/* Text can be an object or a string with address text, location currently unused */
function Address(text,priority,location) {
    console.log("# In address for "+text);
    this.priority=priority;
    var ret;
    if(typeof(text)==='object' &&
       this.set_address(text.address1,text.address2,text.city,text.state,text.postcode,text.country)) this.priority=priority;
    else if((ret=this.parse_address(text.trim()))||true) this.priority=this.priority+ret;
    else this.priority=(1 << 25);
    if(this.address1 && !/^[\d]/.test(this.address1) && /[\d]/.test(this.address1)) {
	this.address1=this.address1.replace(/^[^\d]*/,""); }
}
Address.prototype.parse_address=function(text) {
    if(this.parse_address_US(text)) return 1;
    if(this.parse_address_Canada(text)) return 1;
    if(/[^A-Za-z]Sweden$/.test(text) && this.parse_address_Sweden(text)) return 1;
    if(/[^A-Za-z](UK|United Kingdom)$/.test(text) && this.parse_address_UK(text)) return 1;
    if(/[^A-Za-z](Belgium)$/.test(text) && this.parse_address_Belgium(text)) return 1;
    if(this.parse_address_Europe(text)) {
	return 2; }
    return 1<<25;
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
    var regex1=/^([^,]+),\s*((?:[A-Z]\s*-\s*)?[\d]{4,})\s+([^,]+),\s*([^,]+)$/;
    var regex2=/^([^,]+),\s*\s+([^,]+),\s*((?:[A-Z]+-)?[\d]+),\s*([^,]+)$/;
    var regex3=/^([^,]+),([^,]+),\s*((?:[A-Z]+-)?[\d]+)\s*,\s*([^,]+)$/;
    var regex4=/^([^,]+),\s*((?:[A-Z]\s*-\s*)?[\d]{4,})\s+([^,]+)$/;

    if((match=text.match(regex1)) && this.set_address(match[1],"",match[3],"",match[2],match[4])) return true;
    if((match=text.match(regex2)) && this.set_address(match[1],"",match[2],"",match[3],match[4])) return true;
    if((match=text.match(regex3)) && this.set_address(match[1],"",match[2],"",match[3],match[4])) return true;
    if((match=text.match(regex4)) && this.set_address(match[1],"",match[3],"",match[2],"") return true;

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
    //console.log("UK: split="+JSON.stringify(split));
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
    //console.log("Sweden: split="+JSON.stringify(split));
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
Address.phone_re=/[\+]?[(]?[0-9]{3}[)]?[-\s\.\/]+[0-9]{3}[-\s\.\/]+[0-9]{4,6}(\s*x\s*[\d]{1,3})?/i;

Address.queryList=[];
Address.addressList=[];
Address.phoneList=[];
Address.addressStrList=[];
Address.parse_postal_elem=function(elem,priority,site) {
    var ret={},text;
    var term_map={"streetaddress":"address1","addressLocality":"city","addressRegion":"state","postalCode":"zip","addressCountry":"country"};
    var curr_item,x;
    for(x in term_map) {
        //console.log("term_map["+x+"]="+term_map[x]+"[itemprop='"+x+"'] i");
        if(curr_item=elem.querySelector("[itemprop='"+x+"' i]")) {
            //console.log("curr_item.innerText.trim()="+curr_item.innerText.trim());
            ret[term_map[x]]=curr_item.innerText.trim().replace(/\n/g,",").trim(); }
    }
    if(/,/.test(ret.address1)) {
        ret.address2=ret.address1.replace(/^[^,]+,/,"");
        ret.address1=ret.address1.replace(/,.*$/,"");
    }
    if(ret.address1&&ret.city&&ret.state&&ret.zip) {
        //text=ret.address1+","+ret.city+", "+ret.state+" "+ret.zip;
        //console.log("* Adding address in parse_postal_elem for "+site+", text");
        Address.addressList.push(new Address(ret,priority));
    }
    
};
/* Extra has some kinda of type field and a depth field indicating the depth */
Address.scrape_address=function(doc,url,resolve,reject,extra) {
    var type=extra.type,depth=extra.depth,links=doc.links,i,promise_list=[];
    var contact_regex=/(Contact|Location|Privacy|Kontakt)/i,bad_contact_regex=/^\s*(javascript|mailto):/i,contact2_regex=/contact[^\/]*/i;
    // if(/^(404|403|503|\s*Error)/i.test(doc.title) || /\?reqp\=1&reqr\=/.test(url)) my_query.failed_urls+=2;
    //console.log("In scrape_address for type="+type+", url="+url);
    if(depth===0) {
        for(i=0; i < links.length; i++) {
            links[i].href=MTP.fix_remote_url(links[i].href,url).replace(/\/$/,"");
            if((contact_regex.test(links[i].innerText) || contact2_regex.test(links[i].href))
               && !bad_contact_regex.test(links[i].href) &&
               !Address.queryList.includes(links[i].href) && Address.queryList.length<10) {
                Address.queryList.push(links[i].href);
                //console.log("*** Following link labeled "+links[i].innerText+" to "+links[i].href);
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
        //console.log("&& my_query.address_str_list="+JSON.stringify(Address.addressStrList));
        resolve(""); })
        .catch(function(result) { console.log("Done all promises in scrape_address for "+type);
				  console.log("&& my_query.address_str_list="+JSON.stringify(Address.addressStrList));
				  resolve(""); });
};

Address.scrape_address_page=function(doc,url,resolve,reject,type) {
//    console.log("scrape_address_page,url="+url);
    var posts=doc.querySelectorAll("[itemtype='https://schema.org/PostalAddress']");
    posts.forEach(function(elem) { Address.parse_postal_elem(elem,1,type); });
    var divs=doc.querySelectorAll("div,p,span,td"),i;
    for(i=0;i<divs.length;i++) Address.scrape_address_elem(doc,divs[i],type);
    resolve("");
};
Address.find_phones=function(doc,div,type) {
    var tel=div.querySelectorAll("a[href^='tel'");
    var phoneMatch=div.innerText.match(/[\+]?[(]?[0-9]{3}[)]?[-\s\.\/]+[0-9]{3}[-\s\.\/]+[0-9]{4,6}(\s*x\s*[\d]{1,3})?/ig);
    var i,match;
    if(tel&&tel.length>0) {
	for(i=0;i<tel.length;i++) {
	    if((match=tel[i].innerText.match(Address.phone_re))) {
		Address.phoneList.push({phone:match[0].trim(),priority:2});
	    }
	}
    }
    if(phoneMatch&&phoneMatch.length>0) {
	for(i=1;i<phoneMatch.length;i++) Address.phoneList.push({phone:phoneMatch[i].trim(),priority:1});
    }
};
Address.scrape_address_elem=function(doc,div,type) {
    var scripts=div.querySelectorAll("script,style"),i;
    var heads=doc.querySelectorAll("h1,h2,h3,h4,h5");
    for(i=0;i<heads.length;i++) heads[i].innerHTML="";
    var div_text;
     var nodelist=div.childNodes,curr_node;
    div_text="";

    for(i=0;i<nodelist.length;i++) {
	curr_node=nodelist[i];
	if(curr_node.nodeType===Node.TEXT_NODE) div_text=div_text+"\n"+curr_node.textContent.trim();
	else if(curr_node.nodeType===Node.ELEMENT_NODE&&curr_node.innerText) div_text=div_text+"\n"+curr_node.innerText.trim();
    }
    div_text=div_text.trim().replace(/\n\n+/g,"\n").replace(/(\s)\s+/g,"$1");
    var add_regex1=/Address: (.*)$/,match,add_elem=div.querySelector("address"),text,jsonstuff;
   
    for(i=0;i<scripts.length;i++) scripts[i].innerHTML="";
    Address.find_phones(doc,div,type);
    // console.log("Done removing scripts");
    if(div_text.length>1000) return;
//    console.log("Begin scrape_address_elem on "+div_text);
    try {
        if(div.tagName==="DIV" && /sqs-block-map/.test(div.className) && (jsonstuff=JSON.parse(div.dataset.blockJson))) {
            Address.addressList.push(new Address(jsonstuff.location.addressLine1+","+jsonstuff.location.addressLine2,0));
        }
    }
    catch(error) { console.log("Error parsing jsonstuff"); }
    //    console.log("Past block map");
    if(((match=div_text.match(add_regex1))&&(text=match[1])) || (add_elem && (text=Address.fix_address_text(add_elem.innerText))) ||
       (text=Address.fix_address_text_full(doc,div_text))
      )  {
//        console.log("scrape_elem, text="+text);
        text=text.replace(/\n([\t\s\n])+/g,"\n").replace(/,\s*USA/,"").replace(/\n/g,",").replace(/,[\s,]*/g,",");
        //console.log("scrape_elem, text="+text);
        let parsed;
        // console.log("add_regex1, div="+div.innerText);
        if(!Address.addressStrList.includes(text)) {
            text=text.replace(/,[\s,]*/g,",");
            var address=new Address(text,1);
            if(address.city==="") {
                //console.log("temp_text="+temp_text);
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
Address.fix_address_text_full=function(doc,div_text) {
    var text="";
    if(div_text.trim().length===0) return null;
    text=div_text.match(/(.{1,100}\n+)?(.*(Suite|Ste).*\n+)?.*,\s*[A-Za-z\s]+(,)?\s+[\d\-]+/i);
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
Address.paste_address=function(e,obj,field_map,callback) {
    e.preventDefault();
    var text = e.clipboardData.getData("text/plain").replace(/\s*\n\s*/g,",").replace(/,,/g,",").replace(/,\s*$/g,"").trim();
    console.log("address text="+text);
    var add=new Address(text,-50),x;
    for(x in field_map) if(add[x]!==undefined) obj[field_map[x]]=add[x];
    if(callback!==undefined && typeof(callback)==='function') callback();    
};
