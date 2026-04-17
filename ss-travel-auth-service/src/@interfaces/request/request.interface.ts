export interface RequestInterface {
    user: UserLoggedInterface;
}

export interface UserLoggedInterface {
    id: string;
    email?: string;
    name?: string;
    nip?: string;
    role?: any[];
    module?: any[];
    ppu?: any;
    position?: any;
    token?: string;
}
