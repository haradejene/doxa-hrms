<?php

namespace Tests\Feature;

use App\Auth\DoxaApplicationAccess;
use Doxa\Laravel\Contracts\Transport;
use Doxa\Laravel\Http\JsonResponse;
use Tests\TestCase;

class DoxaApplicationAccessTest extends TestCase
{
    public function test_access_read_uses_verified_exact_subject_and_fails_closed_on_revocation_or_unavailability(): void
    {
        $subject = '11111111-1111-4111-8111-111111111111';
        $application = '22222222-2222-4222-8222-222222222222';
        config(['doxa.issuer' => 'https://iam.test', 'hrm.doxa_application_id' => $application,
            'hrm.doxa_access_read_token' => 'PRIVATE-SERVER-READ-TOKEN']);
        $transport = \Mockery::mock(Transport::class);
        $transport->shouldReceive('request')->with('GET', 'https://iam.test/api/admin/users/'.$subject.'/applications',
            \Mockery::on(fn ($options) => $options['query'] === ['application_ids' => [$application], 'per_page' => 1]
                && $options['headers']['Authorization'] === 'Bearer PRIVATE-SERVER-READ-TOKEN'))
            ->andReturn(new JsonResponse(['data' => [['id' => $application, 'effective_access' => true]]]),
                new JsonResponse(['data' => [['id' => $application, 'effective_access' => false]]]),
                new JsonResponse(['data' => [['id' => 'wrong-application', 'effective_access' => true]]]),
                new JsonResponse(['data' => []]));
        $this->app->instance(Transport::class, $transport);
        $access = new DoxaApplicationAccess;
        $this->assertTrue($access->allowed('https://iam.test', $subject));
        $this->assertFalse($access->allowed('https://iam.test', $subject));
        $this->assertFalse($access->allowed('https://iam.test', $subject));
        $this->assertFalse($access->allowed('https://iam.test', $subject));
        $this->assertFalse($access->allowed('https://other.test', $subject));
        $this->assertFalse($access->allowed('https://iam.test', 'matching@example.test'));
        config(['hrm.doxa_access_read_token' => null]);
        $this->assertFalse($access->allowed('https://iam.test', $subject));
    }

    public function test_transport_failure_is_not_reported_or_treated_as_access(): void
    {
        config(['doxa.issuer' => 'https://iam.test', 'hrm.doxa_application_id' => '22222222-2222-4222-8222-222222222222',
            'hrm.doxa_access_read_token' => 'PRIVATE-READ-TOKEN']);
        $transport = \Mockery::mock(Transport::class);
        $transport->shouldReceive('request')->andThrow(new \RuntimeException('PRIVATE-READ-TOKEN'));
        $this->app->instance(Transport::class, $transport);
        $this->assertFalse((new DoxaApplicationAccess)->allowed('https://iam.test', '11111111-1111-4111-8111-111111111111'));
    }
}
