export interface WorkOrder {

    NoWO: string;

    Date: Date;

    Dept: string;

    Type: string;

    JenisWO: string;

    SubType: string;

    NoIdentification: string;

    Content: string;

    Uraiankerusakan: string;

    UserC: string;

    MulaiPengarjaan: Date | null;

    SelesaiPengarjaan: Date | null;

    TotalDowntime: number;

    DeskripsiTindakan: string;

    TingkatKesulitan: string;

    Closed: number;

    ITPic: string;

    Penyebab: string;

    Tglupdate: Date | null;

    Name: string | null;

}