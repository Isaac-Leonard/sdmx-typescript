import * as interfaces from '../sdmx/interfaces';
import * as sdmx20 from '../sdmx/sdmx20';
import * as sdmx21 from '../sdmx/sdmx21';
import * as message from '../sdmx/message';
import * as commonreferences from '../sdmx/commonreferences';
export class SdmxParser {
    public static PARSER: Array<interfaces.SdmxParserProvider> = [];
    public static parseStructure(s: string): message.StructureType {
        for (var i = 0; i < SdmxParser.PARSER.length; i++) {
            if (SdmxParser.PARSER[i].canParse(s)) {return SdmxParser.PARSER[i].parseStructure(s);}
            //else {
            //    alert("not my type");
            //}
        }
        return null;
    }
    public static parseData(s: string): message.DataMessage {
        for (var i = 0; i < SdmxParser.PARSER.length; i++) {
            if (SdmxParser.PARSER[i].canParse(s)) {return SdmxParser.PARSER[i].parseData(s);}
        }
        return null;
    }
    public static registerParserProvider(p: interfaces.SdmxParserProvider) {
        SdmxParser.PARSER.push(p);

    }
    public static getBaseHeader(): message.Header {
        var header: message.Header = new message.Header();
        header.setId("none");
        header.setTest(false);
        var sender: message.Sender = new message.Sender();
        sender.setId(new commonreferences.ID("Sdmx-Sax"));
        header.setSender(sender);
        var receiver: message.PartyType = new message.PartyType();
        receiver.setId(new commonreferences.ID("You"));
        header.setReceivers([receiver]);
        //var htt:message.HeaderTimeType = new message.HeaderTimeType();
        //htt.setDate(DateTime.now());
        //header.setPrepared(htt);
        return header;
    }
}
SdmxParser.registerParserProvider(new sdmx20.Sdmx20StructureParser());
SdmxParser.registerParserProvider(new sdmx21.Sdmx21StructureParser());

