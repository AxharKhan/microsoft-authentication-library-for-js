import { ProtocolUtils } from "../../src/utils/ProtocolUtils";
import { DECRYPTED_BOUND_RT_AUTHENTICATION_RESULT_DEFAULT_SCOPES, RANDOM_TEST_GUID, RANDOM_TEST_CTX, TEST_CONFIG, TEST_POP_VALUES, SIGNED_BOUND_TOKEN_REQUEST } from "../test_kit/StringConstants";
import { ICrypto, PkceCodes } from "../../src/crypto/ICrypto";
import { Constants } from "../../src/utils/Constants";
import sinon from "sinon";
import { ClientAuthError, ClientAuthErrorMessage } from "../../src/error/ClientAuthError";
import { ServerAuthorizationTokenResponse } from "../../src/response/ServerAuthorizationTokenResponse";

describe("ProtocolUtils.ts Class Unit Tests", () => {

    const userState = "userState";
    const decodedLibState = `{"id":"${RANDOM_TEST_GUID}"}`;
    const encodedLibState = `eyJpZCI6IjExNTUzYTliLTcxMTYtNDhiMS05ZDQ4LWY2ZDRhOGZmODM3MSJ9`;
    const testState = `${encodedLibState}${Constants.RESOURCE_DELIM}${userState}`;

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
                    case encodedLibState:
                        return decodedLibState;
                    default:
                        return input;
                }
            },
            base64Encode(input: string): string {
                switch (input) {
                    case TEST_POP_VALUES.DECODED_REQ_CNF:
                        return TEST_POP_VALUES.ENCODED_REQ_CNF;
                    case `${decodedLibState}`:
                        return encodedLibState;
                    default:
                        return input;
                }
            },
            async generatePkceCodes(): Promise<PkceCodes> {
                return {
                    challenge: TEST_CONFIG.TEST_CHALLENGE,
                    verifier: TEST_CONFIG.TEST_VERIFIER,
                };
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
        sinon.restore();
    });

    it("setRequestState() appends library state to given state", () => {
        const requestState = ProtocolUtils.setRequestState(cryptoInterface, userState);
        expect(requestState).toBe(testState);
    });

    it("setRequestState() only creates library state", () => {
        const requestState = ProtocolUtils.setRequestState(cryptoInterface, "");
        expect(requestState).toBe(encodedLibState);
    });

    it("setRequestState throws error if no crypto object is passed to it", () => {
        // @ts-ignore
        expect(() => ProtocolUtils.setRequestState(null, userState)).toThrowError(ClientAuthError);
        // @ts-ignore
        expect(() => ProtocolUtils.setRequestState(null, userState)).toThrowError(ClientAuthErrorMessage.noCryptoObj.desc);
    });

    it("parseRequestState() throws error if given state is null or empty", () => {
        expect(() => ProtocolUtils.parseRequestState(cryptoInterface, "")).toThrowError(ClientAuthError);
        expect(() => ProtocolUtils.parseRequestState(cryptoInterface, "")).toThrowError(ClientAuthErrorMessage.invalidStateError.desc);

        // @ts-ignore
        expect(() => ProtocolUtils.parseRequestState(cryptoInterface, null)).toThrowError(ClientAuthError);
        // @ts-ignore
        expect(() => ProtocolUtils.parseRequestState(cryptoInterface, null)).toThrowError(ClientAuthErrorMessage.invalidStateError.desc);
    });

    it("parseRequestState() returns empty userRequestState if no resource delimiter found in state string", () => {
        const requestState = ProtocolUtils.parseRequestState(cryptoInterface, decodedLibState);
        expect(requestState.userRequestState).toHaveLength(0);
    });

    it("parseRequestState() correctly splits the state by the resource delimiter", () => {
        const requestState = ProtocolUtils.parseRequestState(cryptoInterface, testState);
        expect(requestState.userRequestState).toBe(userState);
    });

    it("parseRequestState returns user state without decoding", () => {
        const requestState = ProtocolUtils.parseRequestState(cryptoInterface, `${encodedLibState}${Constants.RESOURCE_DELIM}${"test%25u00f1"}`);
        expect(requestState.userRequestState).toBe(`${"test%25u00f1"}`);
    });
    
});