import { buildClientInfo, buildClientInfoFromHomeAccountId, ClientInfo } from "../../src/account/ClientInfo";
import { TEST_CONFIG, TEST_DATA_CLIENT_INFO, RANDOM_TEST_GUID, TEST_POP_VALUES, DECRYPTED_BOUND_RT_AUTHENTICATION_RESULT_DEFAULT_SCOPES, RANDOM_TEST_CTX, SIGNED_BOUND_TOKEN_REQUEST } from "../test_kit/StringConstants";
import { PkceCodes, ICrypto } from "../../src/crypto/ICrypto";
import { ClientAuthError, ClientAuthErrorMessage, Constants, ServerAuthorizationTokenResponse } from "../../src";

describe("ClientInfo.ts Class Unit Tests", () => {

    describe("buildClientInfo()", () => {
        let cryptoInterface: ICrypto;
        beforeEach(() => {
            cryptoInterface = {
                createNewGuid(): string {
                    return RANDOM_TEST_GUID;
                },
                createNewCtx(): Uint8Array {
                    return RANDOM_TEST_CTX;
                },
                base64Decode(input: string): string {
                    switch (input) {
                        case TEST_POP_VALUES.ENCODED_REQ_CNF:
                            return TEST_POP_VALUES.DECODED_REQ_CNF;
                        case TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO:
                            return TEST_DATA_CLIENT_INFO.TEST_DECODED_CLIENT_INFO;
                        default:
                            return input;
                    }
                },
                base64Encode(input: string): string {
                    switch (input) {
                        case "123-test-uid":
                            return "MTIzLXRlc3QtdWlk";
                        case "456-test-uid":
                            return "NDU2LXRlc3QtdWlk";
                        case TEST_POP_VALUES.DECODED_REQ_CNF:
                            return TEST_POP_VALUES.ENCODED_REQ_CNF;
                        default:
                            return input;
                    }
                },
                async generatePkceCodes(): Promise<PkceCodes> {
                    return {
                        challenge: TEST_CONFIG.TEST_CHALLENGE,
                        verifier: TEST_CONFIG.TEST_VERIFIER
                    }
                },
                async getPublicKeyThumbprint(): Promise<string> {
                    return TEST_POP_VALUES.KID;
                },
                async signJwt(): Promise<string> {
                    return "";
                },
                async removeTokenBindingKey(): Promise<boolean> {
                    return Promise.resolve(true);
                },
                async clearKeystore(): Promise<boolean> {
                    return Promise.resolve(true);
                },
                async getAsymmetricPublicKey(): Promise<string> {
                    return TEST_POP_VALUES.DECODED_STK_JWK_THUMBPRINT
                },
                async decryptBoundTokenResponse(): Promise<ServerAuthorizationTokenResponse> {
                    return DECRYPTED_BOUND_RT_AUTHENTICATION_RESULT_DEFAULT_SCOPES;
                },
                async signBoundTokenRequest(): Promise<string> {
                    return SIGNED_BOUND_TOKEN_REQUEST;
                }
            };
        });

        afterEach(() => {
            jest.restoreAllMocks();
        });

        it("Throws error if clientInfo is null or empty", () => {
            // @ts-ignore
            expect(() => buildClientInfo(null, cryptoInterface)).toThrowError(ClientAuthErrorMessage.clientInfoEmptyError.desc);
            // @ts-ignore
            expect(() => buildClientInfo(null, cryptoInterface)).toThrowError(ClientAuthError);

            expect(() => buildClientInfo("", cryptoInterface)).toThrowError(ClientAuthErrorMessage.clientInfoEmptyError.desc);
            expect(() => buildClientInfo("", cryptoInterface)).toThrowError(ClientAuthError);
        });

        it("Throws error if function could not successfully decode ", () => {
            expect(() => buildClientInfo("ThisCan'tbeParsed", cryptoInterface)).toThrowError(ClientAuthErrorMessage.clientInfoDecodingError.desc);
            expect(() => buildClientInfo("ThisCan'tbeParsed", cryptoInterface)).toThrowError(ClientAuthError);
        });

        it("Succesfully returns decoded client info", () => {
            const clientInfo = buildClientInfo(TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO, cryptoInterface);

            expect(clientInfo.uid).toBe(TEST_DATA_CLIENT_INFO.TEST_UID);
            expect(clientInfo.utid).toBe(TEST_DATA_CLIENT_INFO.TEST_UTID);
        });
    });

    describe("buildClientInfoFromHomeAccountId", () => {
        it("throws error if homeAccountId is not in the correct format", () => {
            expect(() => buildClientInfoFromHomeAccountId("")).toThrowError(ClientAuthError);
            expect(() => buildClientInfoFromHomeAccountId("")).toThrowError(ClientAuthErrorMessage.clientInfoDecodingError.desc);
        });

        it("Builds partial clientInfo from homeAccountId with only single string", () => {
            const expectedClientInfo: ClientInfo = {
                uid: TEST_DATA_CLIENT_INFO.TEST_UID,
                utid: Constants.EMPTY_STRING
            };
            expect(buildClientInfoFromHomeAccountId(TEST_DATA_CLIENT_INFO.TEST_UID)).toMatchObject(expectedClientInfo);
        });

        it("successfully returns client info built from homeAccountId", () => {
            const expectedClientInfo: ClientInfo = {
                uid: TEST_DATA_CLIENT_INFO.TEST_UID,
                utid: TEST_DATA_CLIENT_INFO.TEST_UTID
            };
            expect(buildClientInfoFromHomeAccountId(TEST_DATA_CLIENT_INFO.TEST_DECODED_HOME_ACCOUNT_ID)).toMatchObject(expectedClientInfo);
        });
    });
});